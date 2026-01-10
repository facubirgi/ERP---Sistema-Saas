export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ESimple
          </h1>
          <p className="text-gray-600">
            Sistema de Gestión
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
