# Navigate to your project root (outside backend folder)
cd C:\Users\pc\Desktop\AfriCart_bot\Africart_bot

# Create Next.js app
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Navigate to frontend
cd frontend

# Install additional dependencies
npm install axios lucide-react class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-accordion @radix-ui/react-scroll-area @radix-ui/react-separator
npm install date-fns