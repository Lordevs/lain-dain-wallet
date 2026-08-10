import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

interface ProfileImageCropperProps {
  source: string
  onCancel: () => void
  onConfirm: (blob: Blob) => void
}

const OUTPUT_SIZE = 512

export default function ProfileImageCropper({ source, onCancel, onConfirm }: ProfileImageCropperProps) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [cropSize, setCropSize] = useState(() => Math.min(window.innerWidth - 32, 360))
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isExporting, setIsExporting] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef<{ pointerId: number; x: number; y: number; originX: number; originY: number } | null>(null)

  useEffect(() => {
    const resize = () => {
      setCropSize(Math.min(window.innerWidth - 32, 360))
      setOffset({ x: 0, y: 0 })
    }
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const baseScale = useMemo(() => {
    if (!imageSize.width || !imageSize.height) return 1
    return Math.max(cropSize / imageSize.width, cropSize / imageSize.height)
  }, [cropSize, imageSize])

  const displayWidth = imageSize.width * baseScale * zoom
  const displayHeight = imageSize.height * baseScale * zoom
  const maxOffsetX = Math.max(0, (displayWidth - cropSize) / 2)
  const maxOffsetY = Math.max(0, (displayHeight - cropSize) / 2)
  const clampOffset = (x: number, y: number) => ({
    x: Math.max(-maxOffsetX, Math.min(maxOffsetX, x)),
    y: Math.max(-maxOffsetY, Math.min(maxOffsetY, y)),
  })

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      originX: offset.x,
      originY: offset.y,
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setOffset(clampOffset(
      drag.originX + event.clientX - drag.x,
      drag.originY + event.clientY - drag.y,
    ))
  }

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
  }

  const handleConfirm = async () => {
    const image = imageRef.current
    if (!image || !imageSize.width || isExporting) return
    setIsExporting(true)

    const renderedScale = baseScale * zoom
    const sourceX = (displayWidth / 2 - cropSize / 2 - offset.x) / renderedScale
    const sourceY = (displayHeight / 2 - cropSize / 2 - offset.y) / renderedScale
    const sourceSize = cropSize / renderedScale
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const context = canvas.getContext('2d')
    if (!context) {
      setIsExporting(false)
      return
    }
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
    canvas.toBlob((blob) => {
      setIsExporting(false)
      if (blob) onConfirm(blob)
    }, 'image/jpeg', 0.9)
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#101010] text-white select-none">
      <header className="flex h-15 shrink-0 items-center justify-between px-4 pt-[var(--safe-top)] box-content">
        <button type="button" onClick={onCancel} className="px-2 py-3 text-sm font-semibold cursor-pointer">
          Cancel
        </button>
        <h2 className="text-base font-bold">Adjust Photo</h2>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!imageSize.width || isExporting}
          className="px-2 py-3 text-sm font-bold text-[#52C982] disabled:opacity-50 cursor-pointer"
        >
          {isExporting ? 'Saving…' : 'Done'}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-4 pb-[calc(24px+var(--safe-bottom))]">
        <div
          className="relative shrink-0 touch-none overflow-hidden rounded-full bg-black ring-2 ring-white/80"
          style={{ width: cropSize, height: cropSize }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
        >
          <img
            ref={imageRef}
            src={source}
            alt="Photo to crop"
            draggable={false}
            onLoad={(event) => {
              setOffset({ x: 0, y: 0 })
              setImageSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
            style={{
              width: displayWidth || 'auto',
              height: displayHeight || 'auto',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-1/3 border-t border-white/25" />
          <div className="pointer-events-none absolute inset-x-0 bottom-1/3 border-b border-white/25" />
          <div className="pointer-events-none absolute inset-y-0 left-1/3 border-l border-white/25" />
          <div className="pointer-events-none absolute inset-y-0 right-1/3 border-r border-white/25" />
        </div>

        <div className="flex w-full max-w-sm items-center gap-4 px-2">
          <Minus className="size-5 shrink-0 text-white/70" />
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => {
              const nextZoom = Number(event.target.value)
              const nextWidth = imageSize.width * baseScale * nextZoom
              const nextHeight = imageSize.height * baseScale * nextZoom
              const nextMaxX = Math.max(0, (nextWidth - cropSize) / 2)
              const nextMaxY = Math.max(0, (nextHeight - cropSize) / 2)
              setOffset((current) => ({
                x: Math.max(-nextMaxX, Math.min(nextMaxX, current.x)),
                y: Math.max(-nextMaxY, Math.min(nextMaxY, current.y)),
              }))
              setZoom(nextZoom)
            }}
            aria-label="Photo zoom"
            className="h-1 w-full cursor-pointer accent-[#52C982]"
          />
          <Plus className="size-5 shrink-0 text-white/70" />
        </div>
        <p className="text-center text-xs text-white/60">Drag to reposition and use the slider to zoom</p>
      </div>
    </div>
  )
}
