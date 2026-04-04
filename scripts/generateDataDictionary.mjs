import fs from "fs";
import path from "path";

const rootDir = path.resolve(process.cwd());
const schemaPath = path.join(rootDir, "prisma", "schema.prisma");
const outputPath = path.join(rootDir, "Docs", "diccionario_datos.md");

const schema = fs.readFileSync(schemaPath, "utf8");

const scalarTypes = new Set([
  "String",
  "Int",
  "BigInt",
  "Float",
  "Decimal",
  "Boolean",
  "DateTime",
  "Json",
  "Bytes",
]);

function splitWords(value) {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .trim();
}

function formatType(typeToken, attrs) {
  const base = typeToken.replace(/[\[\]?]/g, "");
  const dbTypeMatch = attrs.match(/@db\.([A-Za-z]+)(\(([^)]+)\))?/);

  if (!dbTypeMatch) return base;

  const dbType = dbTypeMatch[1];
  const dbSize = dbTypeMatch[3];
  if (!dbSize) return `${base} (${dbType})`;
  return `${base} (${dbType} ${dbSize})`;
}

function extractSize(attrs) {
  const varchar = attrs.match(/@db\.VarChar\((\d+)\)/);
  if (varchar) return varchar[1];

  const decimal = attrs.match(/@db\.Decimal\((\d+),\s*(\d+)\)/);
  if (decimal) return `${decimal[1]},${decimal[2]}`;

  const charType = attrs.match(/@db\.Char\((\d+)\)/);
  if (charType) return charType[1];

  return "";
}

function extractDefault(attrs) {
  const token = "@default(";
  const start = attrs.indexOf(token);
  if (start === -1) return "";

  let i = start + token.length;
  let depth = 1;
  let value = "";

  while (i < attrs.length && depth > 0) {
    const ch = attrs[i];
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if (depth > 0) value += ch;
    i += 1;
  }

  return value.trim();
}

function fieldDescription(fieldName) {
  const normalized = fieldName.toLowerCase();

  if (normalized === "id") return "Identificador unico del registro.";
  if (normalized.endsWith("id")) return `Identificador de ${splitWords(fieldName.replace(/id$/i, ""))}.`;
  if (normalized.includes("createdat") || normalized.includes("created_at")) return "Fecha y hora de creacion del registro.";
  if (normalized.includes("updatedat") || normalized.includes("updated_at")) return "Fecha y hora de ultima actualizacion.";
  if (normalized.includes("status") || normalized.includes("estado")) return "Estado actual del registro.";
  if (normalized.includes("name") || normalized.includes("nombre")) return "Nombre o etiqueta del registro.";
  if (normalized.includes("email")) return "Correo electronico relacionado.";
  if (normalized.includes("phone") || normalized.includes("telefono")) return "Numero de contacto.";
  if (normalized.includes("date") || normalized.startsWith("fecha")) return "Fecha asociada al registro.";
  if (normalized.includes("description") || normalized.includes("descripcion")) return "Descripcion del dato.";

  return `Dato de ${splitWords(fieldName)}.`;
}

const modelNames = [...schema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((m) => m[1]);
const enumNames = new Set([...schema.matchAll(/^enum\s+(\w+)\s+\{/gm)].map((m) => m[1]));

const models = [];
const modelRegex = /^model\s+(\w+)\s+\{([\s\S]*?)^\}/gm;
let modelMatch;

while ((modelMatch = modelRegex.exec(schema)) !== null) {
  const modelName = modelMatch[1];
  const body = modelMatch[2];
  const lines = body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//"));

  const mapLine = lines.find((line) => line.startsWith("@@map("));
  const mappedTable = mapLine?.match(/@@map\("([^"]+)"\)/)?.[1] || modelName;

  const attributes = [];
  const relationLinks = [];

  for (const line of lines) {
    if (line.startsWith("@@")) continue;
    if (!/^\w+\s+[^\s]+/.test(line)) continue;

    const fieldMatch = line.match(/^(\w+)\s+([^\s]+)\s*(.*)$/);
    if (!fieldMatch) continue;

    const [, fieldName, typeToken, attrs] = fieldMatch;
    const isList = typeToken.endsWith("[]");
    const isOptional = typeToken.endsWith("?");
    const baseType = typeToken.replace(/[\[\]?]/g, "");
    const isModelType = modelNames.includes(baseType);
    const isEnumType = enumNames.has(baseType);
    const hasRelation = attrs.includes("@relation(");

    if (hasRelation && isModelType) {
      const fieldsMatch = attrs.match(/fields:\s*\[([^\]]+)\]/);
      const refsMatch = attrs.match(/references:\s*\[([^\]]+)\]/);
      const relationTable = baseType;

      if (fieldsMatch && refsMatch) {
        const fkFields = fieldsMatch[1].split(",").map((v) => v.trim());
        const refFields = refsMatch[1].split(",").map((v) => v.trim());
        fkFields.forEach((fkField, idx) => {
          relationLinks.push({
            fkField,
            refField: refFields[idx] || refFields[0],
            relationModel: relationTable,
            optional: isOptional,
          });
        });
      }
      continue;
    }

    if (isList) continue;
    if (!scalarTypes.has(baseType) && !isEnumType && isModelType) continue;

    attributes.push({
      fieldName,
      baseType,
      typeToken,
      attrs,
      isOptional,
    });
  }

  models.push({
    modelName,
    tableName: mappedTable,
    attributes,
    relationLinks,
  });
}

const tableMap = Object.fromEntries(models.map((m) => [m.modelName, m.tableName]));

let output = "# Diccionario de Datos\n\n";
output += "Fuente: `astrostar_backend/prisma/schema.prisma`\n\n";
output += `Total de entidades: ${models.length}\n\n`;

for (const model of models) {
  output += `## Entidad: ${model.tableName}\n\n`;
  output += `- **Nombre logico:** ${model.modelName}\n`;
  output += `- **Descripcion:** Registra informacion de ${splitWords(model.modelName)}.\n\n`;
  output += "| Atributo | Tipo | Tamano | Clave Primaria | Restricciones | Descripcion |\n";
  output += "|---|---|---|---|---|---|\n";

  for (const attr of model.attributes) {
    const isPk = attr.attrs.includes("@id");
    const isUnique = attr.attrs.includes("@unique");
    const nullable = attr.isOptional;
    const defaultVal = extractDefault(attr.attrs);
    const fk = model.relationLinks.find((r) => r.fkField === attr.fieldName);
    const fkTarget = fk ? `${tableMap[fk.relationModel] || fk.relationModel}.${fk.refField}` : "";

    const restrictions = [];
    if (isUnique) restrictions.push("Unique");
    if (!nullable) restrictions.push("Not Null");
    if (defaultVal) restrictions.push(`Default(${defaultVal})`);
    if (fkTarget) restrictions.push(`FK -> ${fkTarget}`);

    output += `| ${attr.fieldName} | ${formatType(attr.typeToken, attr.attrs)} | ${extractSize(attr.attrs)} | ${isPk ? "X" : ""} | ${restrictions.join("; ")} | ${fieldDescription(attr.fieldName)} |\n`;
  }

  output += "\n";
  output += "| Nombre Relacion | Con la Tabla | Cardinalidad |\n";
  output += "|---|---|---|\n";

  if (model.relationLinks.length === 0) {
    output += "| - | - | - |\n\n";
    continue;
  }

  const relSeen = new Set();
  for (const rel of model.relationLinks) {
    const target = tableMap[rel.relationModel] || rel.relationModel;
    const key = `${rel.fkField}:${target}`;
    if (relSeen.has(key)) continue;
    relSeen.add(key);
    output += `| ${rel.fkField} | ${target} | N:1 |\n`;
  }
  output += "\n";
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output, "utf8");

console.log(`Diccionario generado en: ${outputPath}`);
