import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="flex flex-col items-center">
          <img
            src="/images/logos/groupm.png"
            alt="GroupM"
            className="h-12 object-contain mb-4"
          />
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Вхід до системи
          </h2>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}