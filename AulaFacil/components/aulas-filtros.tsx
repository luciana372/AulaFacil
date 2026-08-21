"use client"

import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FILTROS_VACIOS, type FiltrosAula } from "@/lib/aulas-filtro"
import { EQUIPAMIENTO_LABEL, TIPOS_EQUIPAMIENTO, type Aula } from "@/lib/types"

const TODAS_LAS_UBICACIONES = "__todas__"
const TODAS_LAS_SEDES = "__todas__"

export function AulasFiltros({
  aulas,
  filtros,
  onChange,
}: {
  aulas: Aula[]
  filtros: FiltrosAula
  onChange: (filtros: FiltrosAula) => void
}) {
  const ubicaciones = [
    ...new Set(aulas.map((a) => a.ubicacion).filter((u): u is string => !!u)),
  ].sort()

  const sedes = [
    ...new Map(
      aulas
        .filter((a): a is Aula & { sedeId: string; sedeNombre: string } =>
          Boolean(a.sedeId && a.sedeNombre)
        )
        .map((a) => [a.sedeId, a.sedeNombre])
    ).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1]))

  const hayFiltrosActivos =
    filtros.capacidadMinima !== null ||
    filtros.ubicacion !== null ||
    filtros.sedeId !== null ||
    filtros.equipamiento.length > 0 ||
    filtros.disponibleAhora

  function toggleEquipamiento(item: (typeof TIPOS_EQUIPAMIENTO)[number]) {
    onChange({
      ...filtros,
      equipamiento: filtros.equipamiento.includes(item)
        ? filtros.equipamiento.filter((e) => e !== item)
        : [...filtros.equipamiento, item],
    })
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border p-3">
      <div className="grid gap-1.5">
        <Label htmlFor="capacidad-minima" className="text-xs">
          Capacidad mínima
        </Label>
        <Input
          id="capacidad-minima"
          type="number"
          min={1}
          className="w-28"
          placeholder="Cualquiera"
          value={filtros.capacidadMinima ?? ""}
          onChange={(e) =>
            onChange({
              ...filtros,
              capacidadMinima: e.target.value ? Number(e.target.value) : null,
            })
          }
        />
      </div>

      {sedes.length > 0 && (
        <div className="grid gap-1.5">
          <Label className="text-xs">Sede</Label>
          <Select
            value={filtros.sedeId ?? TODAS_LAS_SEDES}
            onValueChange={(v) =>
              onChange({
                ...filtros,
                sedeId: v === TODAS_LAS_SEDES ? null : (v ?? null),
              })
            }
            items={{
              [TODAS_LAS_SEDES]: "Todas",
              ...Object.fromEntries(sedes),
            }}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS_LAS_SEDES}>Todas</SelectItem>
              {sedes.map(([id, nombre]) => (
                <SelectItem key={id} value={id}>
                  {nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-1.5">
        <Label className="text-xs">Ubicación</Label>
        <Select
          value={filtros.ubicacion ?? TODAS_LAS_UBICACIONES}
          onValueChange={(v) =>
            onChange({
              ...filtros,
              ubicacion: v === TODAS_LAS_UBICACIONES ? null : (v ?? null),
            })
          }
          items={{
            [TODAS_LAS_UBICACIONES]: "Todas",
            ...Object.fromEntries(ubicaciones.map((u) => [u, u])),
          }}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS_LAS_UBICACIONES}>Todas</SelectItem>
            {ubicaciones.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs">Equipamiento</Label>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {TIPOS_EQUIPAMIENTO.map((item) => (
            <Label
              key={item}
              className="flex items-center gap-1.5 text-sm font-normal"
            >
              <Checkbox
                checked={filtros.equipamiento.includes(item)}
                onCheckedChange={() => toggleEquipamiento(item)}
              />
              {EQUIPAMIENTO_LABEL[item]}
            </Label>
          ))}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs">&nbsp;</Label>
        <Label className="flex items-center gap-1.5 text-sm font-normal">
          <Checkbox
            checked={filtros.disponibleAhora}
            onCheckedChange={() =>
              onChange({ ...filtros, disponibleAhora: !filtros.disponibleAhora })
            }
          />
          Libre ahora
        </Label>
      </div>

      {hayFiltrosActivos && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(FILTROS_VACIOS)}
        >
          <XIcon />
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}
