/**
 * Layout para /admin/* — usa el mismo body styling pero
 * el header/footer del portal público está en el root layout,
 * así que aquí solo envolvemos el contenido.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
