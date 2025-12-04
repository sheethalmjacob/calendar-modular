import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export function Calendar() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Calendar Modular</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl mb-4">Welcome to Your Calendar!</h2>
          <p className="text-gray-600">Calendar view will be built next...</p>
        </div>
      </div>
    </div>
  )
}
