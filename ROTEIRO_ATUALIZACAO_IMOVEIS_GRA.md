# 🏗️ ROTEIRO DE ATUALIZAÇÃO - IMÓVEIS COM CAMPOS GRA

**Data:** 02/01/2026  
**Responsável:** Dev  
**Objetivo:** Adicionar campos GRA e valores complementares à tabela de imóveis

---

## 📋 RESUMO DA ATUALIZAÇÃO

A estrutura atual da tabela `properties` está **incompleta** para comportar os dados de importação de planilhas que incluem:
- Percentual GRA (% de participação)
- Valor ULT (última avaliação)
- Valor de Venda GRA (valor com percentual aplicado)

### Campos Faltantes:
- ❌ `gra_percentage` - Percentual GRA (0-100)
- ❌ `ult_value` - Valor da última avaliação
- ❌ `sale_value_gra` - Valor de venda com GRA aplicado
- ⚠️ `reference_value` → renomear para `sale_value` (melhor clareza)

---

## 🎯 PARTE 1: ATUALIZAÇÃO DO BANCO DE DADOS

### 📌 Passo 1.1: Criar Migration no Supabase

**Arquivo:** Nova migration via MCP Supabase  
**Nome:** `add_gra_fields_to_properties`

```sql
-- =====================================================
-- MIGRATION: Adicionar campos GRA e valores extras
-- DESCRIÇÃO: Adiciona campos para percentual GRA e valores de avaliação
-- DATA: 2026-01-02
-- =====================================================

-- 1. Adicionar campo percentual GRA
ALTER TABLE public.properties 
ADD COLUMN gra_percentage NUMERIC(5,2) DEFAULT 0 
CHECK (gra_percentage >= 0 AND gra_percentage <= 100);

COMMENT ON COLUMN public.properties.gra_percentage IS 'Percentual GRA aplicado ao imóvel (0-100%)';

-- 2. Adicionar campo Valor ULT (última avaliação)
ALTER TABLE public.properties 
ADD COLUMN ult_value NUMERIC(15,2) DEFAULT 0 
CHECK (ult_value >= 0);

COMMENT ON COLUMN public.properties.ult_value IS 'Valor da última avaliação do imóvel';

-- 3. Adicionar campo Valor de Venda GRA
ALTER TABLE public.properties 
ADD COLUMN sale_value_gra NUMERIC(15,2) DEFAULT 0 
CHECK (sale_value_gra >= 0);

COMMENT ON COLUMN public.properties.sale_value_gra IS 'Valor de venda com percentual GRA aplicado';

-- 4. Renomear reference_value para sale_value (opcional mas recomendado)
ALTER TABLE public.properties 
RENAME COLUMN reference_value TO sale_value;

COMMENT ON COLUMN public.properties.sale_value IS 'Valor de venda base do imóvel (sem GRA)';

-- 5. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_properties_gra_percentage 
ON public.properties(gra_percentage);

CREATE INDEX IF NOT EXISTS idx_properties_ult_value 
ON public.properties(ult_value);

CREATE INDEX IF NOT EXISTS idx_properties_sale_value_gra 
ON public.properties(sale_value_gra);

-- 6. Atualizar valores existentes (se houver)
-- Copiar reference_value para sale_value_gra para registros existentes
UPDATE public.properties 
SET sale_value_gra = sale_value 
WHERE sale_value_gra = 0 AND sale_value > 0;
```

### 📌 Passo 1.2: Executar Migration

**Usando MCP Supabase:**
```bash
# Aplicar a migration usando o MCP
mcp_supabase_apply_migration --name "add_gra_fields_to_properties" --query "<SQL acima>"
```

### 📌 Passo 1.3: Verificar Estrutura

**Comando de verificação:**
```sql
-- Verificar se os campos foram criados
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
  AND column_name IN ('gra_percentage', 'ult_value', 'sale_value', 'sale_value_gra')
ORDER BY ordinal_position;
```

---

## 🎯 PARTE 2: ATUALIZAÇÃO DO CÓDIGO - TYPES E INTERFACES

### 📌 Passo 2.1: Atualizar `app/actions/properties.ts`

**Arquivo:** `c:\Users\Acer\Downloads\gestao-carvalho\gestao-carvalho\app\actions\properties.ts`

#### Alteração 1: Atualizar interface `PropertyFormData`

**BUSCAR:**
```typescript
export interface PropertyFormData {
  code?: string
  identification: string
  type: PropertyType
  classe?: string
  subclasse?: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  area: number
  registry: string
  reference_value: number
  status?: PropertyStatus
  notes?: string
}
```

**SUBSTITUIR POR:**
```typescript
export interface PropertyFormData {
  code?: string
  identification: string
  type: PropertyType
  classe?: string
  subclasse?: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  area: number
  registry: string
  gra_percentage?: number          // ⭐ NOVO
  ult_value?: number                // ⭐ NOVO
  sale_value: number                // ⚠️ RENOMEADO (era reference_value)
  sale_value_gra?: number           // ⭐ NOVO
  status?: PropertyStatus
  notes?: string
}
```

#### Alteração 2: Atualizar interface `Property`

**BUSCAR:**
```typescript
export interface Property extends PropertyFormData {
  id: string
  code: string
  status: PropertyStatus
  created_by: string | null
  created_at: string
  updated_at: string
}
```

**SUBSTITUIR POR:**
```typescript
export interface Property extends PropertyFormData {
  id: string
  code: string
  sale_value: number                // ⚠️ GARANTIR que não seja optional
  gra_percentage: number            // ⭐ NOVO
  ult_value: number                 // ⭐ NOVO
  sale_value_gra: number            // ⭐ NOVO
  status: PropertyStatus
  created_by: string | null
  created_at: string
  updated_at: string
}
```

### 📌 Passo 2.2: Atualizar função `createProperty`

**Localização:** Linha ~120-170 em `app/actions/properties.ts`

#### Alteração 1: Adicionar validações

**BUSCAR (linha ~126):**
```typescript
    // Validações
    if (!formData.identification || !formData.type || !formData.street || 
        !formData.number || !formData.neighborhood || !formData.city || 
        !formData.state || !formData.zip_code || !formData.area || 
        !formData.registry || formData.reference_value === undefined) {
      return { success: false, error: 'Todos os campos obrigatórios devem ser preenchidos' }
    }
```

**SUBSTITUIR POR:**
```typescript
    // Validações
    if (!formData.identification || !formData.type || !formData.street || 
        !formData.number || !formData.neighborhood || !formData.city || 
        !formData.state || !formData.zip_code || !formData.area || 
        !formData.registry || formData.sale_value === undefined) {
      return { success: false, error: 'Todos os campos obrigatórios devem ser preenchidos' }
    }
```

#### Alteração 2: Adicionar validação GRA

**ADICIONAR APÓS as validações existentes (linha ~136):**
```typescript
    // Validação percentual GRA
    if (formData.gra_percentage !== undefined && 
        (formData.gra_percentage < 0 || formData.gra_percentage > 100)) {
      return { success: false, error: 'Percentual GRA deve estar entre 0 e 100' }
    }

    if (formData.sale_value < 0) {
      return { success: false, error: 'Valor de venda não pode ser negativo' }
    }

    if (formData.ult_value !== undefined && formData.ult_value < 0) {
      return { success: false, error: 'Valor ULT não pode ser negativo' }
    }

    if (formData.sale_value_gra !== undefined && formData.sale_value_gra < 0) {
      return { success: false, error: 'Valor de venda GRA não pode ser negativo' }
    }
```

#### Alteração 3: Atualizar propertyData

**BUSCAR (linha ~150):**
```typescript
    const propertyData = {
      code,
      identification: formData.identification.trim(),
      type: formData.type,
      classe: formData.classe?.trim() || null,
      subclasse: formData.subclasse?.trim() || null,
      street: formData.street.trim(),
      number: formData.number.trim(),
      complement: formData.complement?.trim() || null,
      neighborhood: formData.neighborhood.trim(),
      city: formData.city.trim(),
      state: formData.state.trim().toUpperCase(),
      zip_code: formData.zip_code.trim(),
      area: formData.area,
      registry: formData.registry.trim(),
      reference_value: formData.reference_value,
      status: formData.status || 'disponivel',
      notes: formData.notes?.trim() || null,
      created_by: user.id,
    }
```

**SUBSTITUIR POR:**
```typescript
    const propertyData = {
      code,
      identification: formData.identification.trim(),
      type: formData.type,
      classe: formData.classe?.trim() || null,
      subclasse: formData.subclasse?.trim() || null,
      street: formData.street.trim(),
      number: formData.number.trim(),
      complement: formData.complement?.trim() || null,
      neighborhood: formData.neighborhood.trim(),
      city: formData.city.trim(),
      state: formData.state.trim().toUpperCase(),
      zip_code: formData.zip_code.trim(),
      area: formData.area,
      registry: formData.registry.trim(),
      gra_percentage: formData.gra_percentage ?? 0,           // ⭐ NOVO
      ult_value: formData.ult_value ?? 0,                      // ⭐ NOVO
      sale_value: formData.sale_value,                         // ⚠️ RENOMEADO
      sale_value_gra: formData.sale_value_gra ?? formData.sale_value, // ⭐ NOVO (default para sale_value)
      status: formData.status || 'disponivel',
      notes: formData.notes?.trim() || null,
      created_by: user.id,
    }
```

### 📌 Passo 2.3: Atualizar função `updateProperty`

**Localização:** Linha ~200-260 em `app/actions/properties.ts`

#### Alteração 1: Atualizar validações

**BUSCAR (linha ~220):**
```typescript
    if (formData.reference_value !== undefined && formData.reference_value < 0) {
      return { success: false, error: 'Valor de referência não pode ser negativo' }
    }
```

**SUBSTITUIR POR:**
```typescript
    if (formData.sale_value !== undefined && formData.sale_value < 0) {
      return { success: false, error: 'Valor de venda não pode ser negativo' }
    }

    if (formData.gra_percentage !== undefined && 
        (formData.gra_percentage < 0 || formData.gra_percentage > 100)) {
      return { success: false, error: 'Percentual GRA deve estar entre 0 e 100' }
    }

    if (formData.ult_value !== undefined && formData.ult_value < 0) {
      return { success: false, error: 'Valor ULT não pode ser negativo' }
    }

    if (formData.sale_value_gra !== undefined && formData.sale_value_gra < 0) {
      return { success: false, error: 'Valor de venda GRA não pode ser negativo' }
    }
```

#### Alteração 2: Atualizar updateData

**BUSCAR (linha ~240):**
```typescript
    if (formData.area !== undefined) updateData.area = formData.area
    if (formData.registry) updateData.registry = formData.registry.trim()
    if (formData.reference_value !== undefined) updateData.reference_value = formData.reference_value
    if (formData.status) updateData.status = formData.status
```

**SUBSTITUIR POR:**
```typescript
    if (formData.area !== undefined) updateData.area = formData.area
    if (formData.registry) updateData.registry = formData.registry.trim()
    if (formData.gra_percentage !== undefined) updateData.gra_percentage = formData.gra_percentage  // ⭐ NOVO
    if (formData.ult_value !== undefined) updateData.ult_value = formData.ult_value                // ⭐ NOVO
    if (formData.sale_value !== undefined) updateData.sale_value = formData.sale_value             // ⚠️ RENOMEADO
    if (formData.sale_value_gra !== undefined) updateData.sale_value_gra = formData.sale_value_gra // ⭐ NOVO
    if (formData.status) updateData.status = formData.status
```

### 📌 Passo 2.4: Atualizar função `searchProperties`

**BUSCAR (linha ~340):**
```typescript
    if (filters.minValue !== undefined) {
      query = query.gte('reference_value', filters.minValue)
    }

    if (filters.maxValue !== undefined) {
      query = query.lte('reference_value', filters.maxValue)
    }
```

**SUBSTITUIR POR:**
```typescript
    if (filters.minValue !== undefined) {
      query = query.gte('sale_value', filters.minValue)
    }

    if (filters.maxValue !== undefined) {
      query = query.lte('sale_value', filters.maxValue)
    }
```

---

## 🎯 PARTE 3: ATUALIZAÇÃO DO CÓDIGO - TIPOS GLOBAIS

### 📌 Passo 3.1: Atualizar `lib/types.ts`

**Arquivo:** `c:\Users\Acer\Downloads\gestao-carvalho\gestao-carvalho\lib\types.ts`

**BUSCAR a interface Property:**
```typescript
export interface Property {
  id: string
  code: string
  identification: string
  type: string
  classe?: string
  subclasse?: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  area: number
  registry: string
  reference_value: number
  status: string
  notes?: string
  created_by?: string | null
  created_at: string
  updated_at: string
}
```

**SUBSTITUIR POR:**
```typescript
export interface Property {
  id: string
  code: string
  identification: string
  type: string
  classe?: string
  subclasse?: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  area: number
  registry: string
  gra_percentage: number        // ⭐ NOVO
  ult_value: number              // ⭐ NOVO
  sale_value: number             // ⚠️ RENOMEADO (era reference_value)
  sale_value_gra: number         // ⭐ NOVO
  status: string
  notes?: string
  created_by?: string | null
  created_at: string
  updated_at: string
}
```

---

## 🎯 PARTE 4: ATUALIZAÇÃO DOS COMPONENTES - FORMULÁRIOS

### 📌 Passo 4.1: Atualizar `property-create-modal.tsx`

**Arquivo:** `c:\Users\Acer\Downloads\gestao-carvalho\gestao-carvalho\components\database\property-create-modal.tsx`

#### Alteração 1: Adicionar campos ao formData

**BUSCAR (linha ~27):**
```typescript
  const [formData, setFormData] = React.useState({
    identification: "",
    type: "",
    classe: "",
    subclasse: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    area: "",
    registry: "",
    reference_value: "",
    notes: "",
  })
```

**SUBSTITUIR POR:**
```typescript
  const [formData, setFormData] = React.useState({
    identification: "",
    type: "",
    classe: "",
    subclasse: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    area: "",
    registry: "",
    gra_percentage: "",      // ⭐ NOVO
    ult_value: "",           // ⭐ NOVO
    sale_value: "",          // ⚠️ RENOMEADO
    sale_value_gra: "",      // ⭐ NOVO
    notes: "",
  })
```

#### Alteração 2: Atualizar handleSubmit

**BUSCAR (linha ~113):**
```typescript
    const result = await createProperty({
      identification: formData.identification,
      type: formData.type as any,
      classe: formData.classe || undefined,
      subclasse: formData.subclasse || undefined,
      street: formData.street,
      number: formData.number,
      complement: formData.complement || undefined,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
      area: Number(formData.area),
      registry: formData.registry,
      reference_value: Number(formData.reference_value) || 0,
      notes: formData.notes || undefined,
    })
```

**SUBSTITUIR POR:**
```typescript
    const result = await createProperty({
      identification: formData.identification,
      type: formData.type as any,
      classe: formData.classe || undefined,
      subclasse: formData.subclasse || undefined,
      street: formData.street,
      number: formData.number,
      complement: formData.complement || undefined,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
      area: Number(formData.area),
      registry: formData.registry,
      gra_percentage: Number(formData.gra_percentage) || 0,     // ⭐ NOVO
      ult_value: Number(formData.ult_value) || 0,               // ⭐ NOVO
      sale_value: Number(formData.sale_value) || 0,             // ⚠️ RENOMEADO
      sale_value_gra: Number(formData.sale_value_gra) || 0,     // ⭐ NOVO
      notes: formData.notes || undefined,
    })
```

#### Alteração 3: Atualizar reset do formulário

**BUSCAR (linha ~140):**
```typescript
      setFormData({
        identification: "",
        type: "",
        classe: "",
        subclasse: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zip_code: "",
        area: "",
        registry: "",
        reference_value: "",
        notes: "",
      })
```

**SUBSTITUIR POR:**
```typescript
      setFormData({
        identification: "",
        type: "",
        classe: "",
        subclasse: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zip_code: "",
        area: "",
        registry: "",
        gra_percentage: "",      // ⭐ NOVO
        ult_value: "",           // ⭐ NOVO
        sale_value: "",          // ⚠️ RENOMEADO
        sale_value_gra: "",      // ⭐ NOVO
        notes: "",
      })
```

#### Alteração 4: Adicionar campos no formulário (APÓS o campo "registry")

**LOCALIZAÇÃO:** Após o campo de matrícula (linha ~300), **ADICIONAR:**

```tsx
            {/* SEÇÃO: VALORES E PERCENTUAIS */}
            <div className="col-span-2">
              <h3 className="text-sm font-semibold text-foreground mb-3 border-b pb-2">
                💰 Valores e Percentuais
              </h3>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gra_percentage">
                % GRA
                <span className="text-xs text-muted-foreground ml-1">(0-100)</span>
              </Label>
              <Input
                id="gra_percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="Ex: 15.50"
                value={formData.gra_percentage}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, gra_percentage: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ult_value">Valor ULT</Label>
              <Input
                id="ult_value"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 350000.00"
                value={formData.ult_value}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ult_value: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sale_value">Valor de Venda *</Label>
              <Input
                id="sale_value"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 450000.00"
                value={formData.sale_value}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sale_value: e.target.value }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sale_value_gra">
                Valor de Venda GRA
                <span className="text-xs text-muted-foreground ml-1">(calculado)</span>
              </Label>
              <Input
                id="sale_value_gra"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 520000.00"
                value={formData.sale_value_gra}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sale_value_gra: e.target.value }))
                }
              />
            </div>
```

### 📌 Passo 4.2: Atualizar `edit-property-dialog.tsx`

**Arquivo:** `c:\Users\Acer\Downloads\gestao-carvalho\gestao-carvalho\components\database\edit-property-dialog.tsx`

#### Alteração 1: Adicionar campos ao formData

**BUSCAR (linha ~31):**
```typescript
  const [formData, setFormData] = useState({
    identification: "",
    type: "",
    classe: "",
    subclasse: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    area: "",
    registry: "",
    reference_value: "",
    notes: "",
  })
```

**SUBSTITUIR POR:**
```typescript
  const [formData, setFormData] = useState({
    identification: "",
    type: "",
    classe: "",
    subclasse: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    area: "",
    registry: "",
    gra_percentage: "",      // ⭐ NOVO
    ult_value: "",           // ⭐ NOVO
    sale_value: "",          // ⚠️ RENOMEADO
    sale_value_gra: "",      // ⭐ NOVO
    notes: "",
  })
```

#### Alteração 2: Atualizar useEffect

**BUSCAR (linha ~52):**
```typescript
  useEffect(() => {
    if (property) {
      setFormData({
        identification: property.identification || "",
        type: property.type || "",
        classe: property.classe || "",
        subclasse: property.subclasse || "",
        street: property.street || "",
        number: property.number || "",
        complement: property.complement || "",
        neighborhood: property.neighborhood || "",
        city: property.city || "",
        state: property.state || "",
        zip_code: property.zip_code || "",
        area: property.area?.toString() || "",
        registry: property.registry || "",
        reference_value: property.reference_value?.toString() || "",
        notes: property.notes || "",
      })
    }
  }, [property])
```

**SUBSTITUIR POR:**
```typescript
  useEffect(() => {
    if (property) {
      setFormData({
        identification: property.identification || "",
        type: property.type || "",
        classe: property.classe || "",
        subclasse: property.subclasse || "",
        street: property.street || "",
        number: property.number || "",
        complement: property.complement || "",
        neighborhood: property.neighborhood || "",
        city: property.city || "",
        state: property.state || "",
        zip_code: property.zip_code || "",
        area: property.area?.toString() || "",
        registry: property.registry || "",
        gra_percentage: property.gra_percentage?.toString() || "",   // ⭐ NOVO
        ult_value: property.ult_value?.toString() || "",             // ⭐ NOVO
        sale_value: property.sale_value?.toString() || "",           // ⚠️ RENOMEADO
        sale_value_gra: property.sale_value_gra?.toString() || "",   // ⭐ NOVO
        notes: property.notes || "",
      })
    }
  }, [property])
```

#### Alteração 3: Atualizar handleSubmit

**BUSCAR (linha ~103):**
```typescript
    const dataToSubmit = {
      ...formData,
      area: formData.area ? parseFloat(formData.area) : 0,
      reference_value: formData.reference_value ? parseFloat(formData.reference_value) : 0,
    }
```

**SUBSTITUIR POR:**
```typescript
    const dataToSubmit = {
      ...formData,
      area: formData.area ? parseFloat(formData.area) : 0,
      gra_percentage: formData.gra_percentage ? parseFloat(formData.gra_percentage) : 0,     // ⭐ NOVO
      ult_value: formData.ult_value ? parseFloat(formData.ult_value) : 0,                    // ⭐ NOVO
      sale_value: formData.sale_value ? parseFloat(formData.sale_value) : 0,                 // ⚠️ RENOMEADO
      sale_value_gra: formData.sale_value_gra ? parseFloat(formData.sale_value_gra) : 0,     // ⭐ NOVO
    }
```

#### Alteração 4: Adicionar campos no formulário (mesmos campos do create-modal)

**LOCALIZAÇÃO:** Após o campo de matrícula, **ADICIONAR os mesmos campos de valores do passo 4.1**

---

## 🎯 PARTE 5: ATUALIZAÇÃO DA TABELA DE VISUALIZAÇÃO

### 📌 Passo 5.1: Atualizar `properties-table.tsx`

**Arquivo:** `c:\Users\Acer\Downloads\gestao-carvalho\gestao-carvalho\components\database\properties-table.tsx`

#### Alteração 1: Adicionar colunas na tabela

**BUSCAR (linha ~195 - após a coluna "registry"):**
```typescript
    {
      key: "registry",
      label: "Matrícula",
      width: "w-28",
      render: (property) => <span className="font-mono text-sm">{property.registry}</span>,
    },
```

**ADICIONAR APÓS:**
```typescript
    {
      key: "gra_percentage",
      label: "% GRA",
      width: "w-24",
      align: "right",
      render: (property) => (
        <span className="text-sm font-semibold text-blue-600">
          {property.gra_percentage?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
        </span>
      ),
    },
    {
      key: "ult_value",
      label: "Valor ULT",
      width: "w-32",
      align: "right",
      render: (property) => (
        <span className="text-sm text-muted-foreground">
          R$ {property.ult_value?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "sale_value",
      label: "Valor Venda",
      width: "w-32",
      align: "right",
      render: (property) => (
        <span className="text-sm font-medium">
          R$ {property.sale_value?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "sale_value_gra",
      label: "Valor GRA",
      width: "w-32",
      align: "right",
      render: (property) => (
        <span className="text-sm font-semibold text-green-600">
          R$ {property.sale_value_gra?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### Banco de Dados:
- [ ] Migration criada e aplicada com sucesso
- [ ] Campos `gra_percentage`, `ult_value`, `sale_value_gra` criados
- [ ] Campo `reference_value` renomeado para `sale_value`
- [ ] Índices criados para performance
- [ ] Constraints CHECK aplicados corretamente
- [ ] Dados existentes migrados (se houver)

### Código - Types:
- [ ] Interface `PropertyFormData` atualizada em `actions/properties.ts`
- [ ] Interface `Property` atualizada em `actions/properties.ts`
- [ ] Interface `Property` atualizada em `lib/types.ts`

### Código - Actions:
- [ ] Função `createProperty` atualizada com novos campos
- [ ] Função `updateProperty` atualizada com novos campos
- [ ] Função `searchProperties` atualizada (reference_value → sale_value)
- [ ] Validações adicionadas para campos GRA

### Código - Componentes:
- [ ] `property-create-modal.tsx` atualizado com novos campos
- [ ] `edit-property-dialog.tsx` atualizado com novos campos
- [ ] `properties-table.tsx` atualizado com novas colunas
- [ ] FormData states atualizados
- [ ] HandleSubmit functions atualizadas

### Testes:
- [ ] Criar novo imóvel com campos GRA
- [ ] Editar imóvel existente
- [ ] Visualizar imóveis na tabela com novos campos
- [ ] Verificar formatação de valores monetários
- [ ] Verificar validações de percentual (0-100)
- [ ] Testar importação de planilha (quando implementado)

---

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA

1. **PRIMEIRA:** Aplicar migration no banco de dados (Parte 1)
2. **SEGUNDA:** Atualizar types e interfaces (Partes 2 e 3)
3. **TERCEIRA:** Atualizar actions (Parte 2)
4. **QUARTA:** Atualizar componentes de formulário (Parte 4)
5. **QUINTA:** Atualizar tabela de visualização (Parte 5)
6. **SEXTA:** Testar todas as funcionalidades (Checklist)

---

## 📝 OBSERVAÇÕES IMPORTANTES

### Cálculo Automático do Valor GRA
Considere adicionar uma função helper para calcular automaticamente o `sale_value_gra`:

```typescript
// Adicionar em lib/utils.ts ou similar
export function calculateSaleValueGRA(saleValue: number, graPercentage: number): number {
  return saleValue * (1 + graPercentage / 100)
}
```

### Migração de Dados Existentes
Se já existem imóveis cadastrados:
- Os novos campos serão preenchidos com `0` (valor padrão)
- Considere atualizar manualmente ou via script SQL
- Pode ser necessário recalcular `sale_value_gra` baseado em `sale_value`

### Importação de Planilhas
Após essa atualização, o sistema estará preparado para importar planilhas com os campos:
- Código ✅
- Tipo ✅
- Classe ✅
- Sub-classe ✅
- Nome usual ✅
- Endereço ✅
- Bairro ✅
- Cidade ✅
- Área ✅
- Matrícula ✅
- % GRA ✅ (NOVO)
- Valor ULT ✅ (NOVO)
- Valor de Venda ✅
- Valor de Venda GRA ✅ (NOVO)
- Data da atualização ✅ (updated_at)

---

## 🆘 TROUBLESHOOTING

### Erro: "column reference_value does not exist"
**Solução:** O campo foi renomeado para `sale_value`. Verifique se todos os arquivos foram atualizados.

### Erro: "violates check constraint"
**Solução:** Verifique se os valores de `gra_percentage` estão entre 0 e 100, e se os valores monetários não são negativos.

### Campos não aparecem no formulário
**Solução:** Verifique se os campos foram adicionados no JSX do componente e se o formData foi atualizado.

### Valores não são salvos
**Solução:** Verifique se o `handleSubmit` está convertendo strings para números corretamente com `parseFloat()`.

---

**FIM DO ROTEIRO**

Data de criação: 02/01/2026  
Última atualização: 02/01/2026
