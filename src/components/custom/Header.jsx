import { Button } from '@/components/ui/button'

function Header() {
  return (
    <div className='p-4 shadow-md flex justify-between items-center px-8 bg-white sticky top-0 z-10'>
      <div className="flex items-center">
        <img src='logo.svg' alt='Logo' className='h-16 w-auto' />
        <span className='ml-2 text-xl font-bold text-gray-800'>Travel Rover</span>
      </div>
      <div>
        <Button className="bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 text-white font-medium rounded-full px-6 transition-all duration-200">
          Sign In
        </Button>
      </div>
    </div>
  )
}

export default Header
