# 🚀 REFACTOR IMPLEMENTATION GUIDE - DUAL INVENTORY SYSTEM

## ✅ COMPLETED STEPS

### 1. Database Migration
- ✅ Created migration `20260223120000_split_inventory_foundation_events`
- ✅ Added `stock_fundacion` and `stock_eventos` columns
- ✅ Migrated existing data (all to `stock_fundacion`)
- ✅ Removed old `stock` column
- ✅ Added `inventario_origen` and `inventario_destino` to movements
- ✅ Simplified `event_material_assignments` → `event_materials`
- ✅ Applied migration successfully

### 2. Prisma Schema Updates
- ✅ Added `InventoryType` enum (FUNDACION, EVENTOS)
- ✅ Updated `Material` model with dual stock columns
- ✅ Updated `MaterialMovement` with inventory fields
- ✅ Simplified `EventMaterial` model (removed virtual reservation fields)
- ✅ Removed `EventAssignmentStatus` enum (no longer needed)
- ✅ Generated Prisma Client

---

## 📋 NEXT STEPS - BACKEND

### 3. Update Repositories

#### materials.repository.js
- [ ] Update `findAll()` to return `stockFundacion` and `stockEventos`
- [ ] Remove `calculateReservedStock()` method (no longer needed)
- [ ] Update `findById()` to return dual stock
- [ ] Update `create()` - stocks start at 0
- [ ] Update `update()` - no stock changes here
- [ ] Update `registerDischarge()` - deduct from correct inventory
- [ ] Remove all references to single `stock` field

#### movements.repository.js
- [ ] Update `registerMovement()` for dual inventory logic
- [ ] Add support for `inventario_origen` and `inventario_destino`
- [ ] Simplify logic (no more virtual reservations)
- [ ] Update `deleteMovement()` to handle dual stock reversal

#### eventAssignments.repository.js → eventMaterials.repository.js
- [ ] Rename file to `eventMaterials.repository.js`
- [ ] Simplify to basic CRUD (no states, no finalization)
- [ ] Remove `finalizeEvent()` method
- [ ] Remove `calculateReservedStock()` method
- [ ] Add `create()` - simple assignment
- [ ] Add `delete()` - simple removal with stock reversal

### 4. Create New Repository

#### transfers.repository.js (NEW)
- [ ] Create `transferStock()` method
- [ ] Validate source inventory has sufficient stock
- [ ] Update both inventory columns
- [ ] Create movement record with type TRANSFERENCIA

### 5. Update Services

#### materials.service.js
- [ ] Update all methods to work with dual stock
- [ ] Remove `stockReservado` calculations
- [ ] Update validation logic
- [ ] Update `registerDischarge()` to specify inventory

#### movements.service.js
- [ ] Update `registerMovement()` for new flow
- [ ] Add validation for `inventario_destino`
- [ ] Simplify logic (no auto-assignment creation)
- [ ] Update error messages

#### eventAssignments.service.js → eventMaterials.service.js
- [ ] Rename to `eventMaterials.service.js`
- [ ] Remove `finalizeEvent()` method
- [ ] Simplify `assignMaterial()` - immediate deduction
- [ ] Add `removeAssignment()` - stock reversal
- [ ] Remove all state management logic

#### transfers.service.js (NEW)
- [ ] Create service for inventory transfers
- [ ] Validate transfer between different inventories
- [ ] Validate sufficient stock in source
- [ ] Call repository method

### 6. Update Controllers

#### materials.controller.js
- [ ] Update response format (dual stock)
- [ ] No major changes needed

#### movements.controller.js
- [ ] Update request validation
- [ ] Handle new inventory fields

#### eventAssignments.controller.js → eventMaterials.controller.js
- [ ] Rename to `eventMaterials.controller.js`
- [ ] Remove `finalizeEvent()` endpoint
- [ ] Simplify `assignMaterial()` endpoint
- [ ] Add `removeAssignment()` endpoint

#### transfers.controller.js (NEW)
- [ ] Create controller for transfers
- [ ] Add `POST /api/materials/:id/transfer` endpoint

### 7. Update Routes

#### materials.routes.js
- [ ] Add transfer route
- [ ] Update documentation

#### eventAssignments.routes.js → eventMaterials.routes.js
- [ ] Rename file
- [ ] Remove finalize route
- [ ] Simplify routes
- [ ] Update Swagger docs

---

## 📋 NEXT STEPS - FRONTEND

### 8. Update Services

#### materialsService.js
- [ ] Update to handle dual stock in responses
- [ ] Add `transferStock()` method

#### movementsService.js
- [ ] Update `createMovement()` to send `inventario_destino`
- [ ] Update request format

#### eventMaterialsService.js (NEW or rename)
- [ ] Create/rename from eventAssignmentsService
- [ ] Add `assignMaterial()` method
- [ ] Add `removeAssignment()` method
- [ ] Remove `finalizeEvent()` method

### 9. Update Components

#### MaterialsCatalog.jsx
- [ ] Update table columns: Fundación | Eventos | Total
- [ ] Add "Transfer" button
- [ ] Update stock display logic

#### MaterialModal.jsx (Ingreso)
- [ ] Update form to select `inventario_destino`
- [ ] Remove old `destinoStock` field
- [ ] Simplify event selection

#### TransferModal.jsx (NEW)
- [ ] Create new modal component
- [ ] From/To inventory selectors
- [ ] Quantity input with validation
- [ ] Observations field

#### EventDetail.jsx
- [ ] Add "Materials" section
- [ ] Add "Assign Material" button
- [ ] Show assigned materials table
- [ ] Add remove button per material

#### AssignMaterialModal.jsx (NEW)
- [ ] Create modal for assigning to event
- [ ] Material selector (only from stock_eventos)
- [ ] Quantity input
- [ ] Observations

---

## 🎯 KEY CHANGES SUMMARY

### What Changed:
1. **Single stock → Dual stock** (`stock_fundacion` + `stock_eventos`)
2. **Virtual reservations → Immediate deduction** (no more states)
3. **Complex event finalization → Simple assignment/removal**
4. **Added inventory transfers** (new feature)

### What Was Removed:
- `EventAssignmentStatus` enum
- `cantidad_usada`, `cantidad_devuelta` fields
- `estado`, `fecha_finalizacion` fields
- `calculateReservedStock()` methods
- `finalizeEvent()` logic
- Virtual reservation complexity

### What Was Added:
- `stock_fundacion` and `stock_eventos` columns
- `inventario_origen` and `inventario_destino` fields
- `InventoryType` enum
- Transfer functionality
- Simplified event materials management

---

## 🔥 IMPLEMENTATION PRIORITY

1. **HIGH PRIORITY** (Core functionality):
   - Update materials repository ✅
   - Update movements repository ✅
   - Create transfers repository ✅
   - Update services ✅

2. **MEDIUM PRIORITY** (API):
   - Update controllers ✅
   - Update routes ✅
   - Test endpoints ✅

3. **LOW PRIORITY** (Frontend):
   - Update components
   - Add transfer UI
   - Update event detail page

---

## 📝 TESTING CHECKLIST

### Backend Tests:
- [ ] Create material with dual stock
- [ ] Ingresar material to FUNDACION
- [ ] Ingresar material to EVENTOS
- [ ] Transfer stock between inventories
- [ ] Assign material to event (deducts stock_eventos)
- [ ] Remove assignment (returns stock_eventos)
- [ ] Register baja from specific inventory
- [ ] Validate insufficient stock errors

### Frontend Tests:
- [ ] Display dual stock correctly
- [ ] Ingreso modal works with new fields
- [ ] Transfer modal works
- [ ] Event detail shows materials
- [ ] Assign material to event works
- [ ] Remove assignment works
- [ ] All validations work

---

**Status**: Migration and Schema ✅ COMPLETE  
**Next**: Update Repositories and Services  
**Date**: 2026-02-23
