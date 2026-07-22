export default function BrandLogo() {
  return (
    <div className="flex flex-col items-center mt-2 mb-8 select-none">
      <div className="flex items-center gap-1.5 text-[32px] font-extrabold tracking-tight">
        <span className="text-primary">Lain</span>
        <span className="text-secondary">Dain</span>
      </div>
      <span className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground opacity-90 uppercase">
        Wallet
      </span>
    </div>
  )
}
