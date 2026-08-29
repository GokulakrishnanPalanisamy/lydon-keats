export default function Spinner({ size = 20, center = false }: { size?: number; center?: boolean }) {
  const spinner = <span className="spinner" style={{ width: size, height: size }} role="status" aria-label="Loading" />

  if (center) {
    return <div className="spinner-center">{spinner}</div>
  }

  return spinner
}
