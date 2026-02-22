import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Реєстрація</h2>
        <p className="text-gray-500">
          Реєстрація нових користувачів виконується адміністратором системи.
        </p>
        <Link href="/login" className="text-blue-600 hover:text-blue-500 text-sm">
          Повернутись до входу
        </Link>
      </div>
    </div>
  )
}