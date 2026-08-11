"use client"

import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SearchableSelectOption {
    id: number
    name: string
}

interface SearchableSelectProps {
    options: SearchableSelectOption[]
    selectedId: number | null
    onChange: (id: number | null) => void
    disabled?: boolean
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    clearable?: boolean
}

export function SearchableSelect({
    options,
    selectedId,
    onChange,
    disabled = false,
    placeholder = "Оберіть...",
    searchPlaceholder = "Пошук...",
    emptyText = "Не знайдено",
    clearable = true,
}: SearchableSelectProps) {
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

    const selectedOption = options.find((o) => o.id === selectedId) ?? null

    const handleSelect = (id: number) => {
        onChange(id)
        setOpen(false)
        setSearch("")
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(null)
    }

    return (
        <div ref={ref} className="relative w-full">
            <div
                className={cn(
                    "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer flex items-center gap-2",
                    disabled && "opacity-50 cursor-not-allowed",
                    open && "ring-2 ring-ring ring-offset-2"
                )}
                onClick={() => !disabled && setOpen((prev) => !prev)}
            >
                {selectedOption ? (
                    <span className="truncate flex-1">{selectedOption.name}</span>
                ) : (
                    <span className="text-muted-foreground flex-1 truncate">{placeholder}</span>
                )}
                {clearable && selectedOption && (
                    <X
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={handleClear}
                    />
                )}
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform shrink-0",
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

                    <div className="max-h-56 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="py-4 text-center text-sm text-muted-foreground">
                                {emptyText}
                            </div>
                        ) : (
                            filtered.map((option) => {
                                const checked = option.id === selectedId
                                return (
                                    <div
                                        key={option.id}
                                        className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleSelect(option.id)
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
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