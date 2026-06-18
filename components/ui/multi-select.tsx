"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface MultiSelectOption {
    id: number
    name: string
}

interface MultiSelectProps {
    options: MultiSelectOption[]
    selectedIds: number[]
    onChange: (ids: number[]) => void
    disabled?: boolean
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    selectAllText?: string
    clearText?: string
}

export function MultiSelect({
    options,
    selectedIds,
    onChange,
    disabled = false,
    placeholder = "Всі",
    searchPlaceholder = "Пошук...",
    emptyText = "Не знайдено",
    selectAllText = "Вибрати всіх",
    clearText = "Очистити",
}: MultiSelectProps) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
                setSearch("")
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const filtered = options.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase())
    )

    const toggle = (id: number) => {
        onChange(
            selectedIds.includes(id)
                ? selectedIds.filter((x) => x !== id)
                : [...selectedIds, id]
        )
    }

    const removeChip = (id: number, e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(selectedIds.filter((x) => x !== id))
    }

    const selectedOptions = options.filter((o) => selectedIds.includes(o.id))

    return (
        <div ref={ref} className="relative w-full">
            <div
                className={cn(
                    "min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer flex flex-wrap gap-1 items-center",
                    disabled && "opacity-50 cursor-not-allowed",
                    open && "ring-2 ring-ring ring-offset-2"
                )}
                onClick={() => !disabled && setOpen((prev) => !prev)}
            >
                {selectedOptions.length === 0 ? (
                    <span className="text-muted-foreground">{placeholder}</span>
                ) : (
                    selectedOptions.map((o) => (
                        <Badge
                            key={o.id}
                            variant="secondary"
                            className="flex items-center gap-1 text-xs"
                        >
                            {o.name}
                            <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={(e) => removeChip(o.id, e)}
                            />
                        </Badge>
                    ))
                )}
                <ChevronDown
                    className={cn(
                        "ml-auto h-4 w-4 text-muted-foreground transition-transform shrink-0",
                        open && "rotate-180"
                    )}
                />
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                    <div className="p-2 border-b">
                        <input
                            className="w-full text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>

                    <div className="flex items-center justify-between px-3 py-1.5 border-b text-xs text-muted-foreground">
                        <button
                            className="hover:text-foreground transition-colors"
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange(options.map((o) => o.id))
                            }}
                        >
                            {selectAllText}
                        </button>
                        <button
                            className="hover:text-foreground transition-colors"
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange([])
                            }}
                        >
                            {clearText}
                        </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                                {emptyText}
                            </div>
                        ) : (
                            filtered.map((option) => {
                                const checked = selectedIds.includes(option.id)
                                return (
                                    <div
                                        key={option.id}
                                        className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            toggle(option.id)
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                                                checked
                                                    ? "bg-primary border-primary"
                                                    : "border-input bg-background"
                                            )}
                                        >
                                            {checked && (
                                                <Check className="h-3 w-3 text-primary-foreground" />
                                            )}
                                        </div>
                                        <span>{option.name}</span>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}