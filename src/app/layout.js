import './globals.css'

export const metadata = {
  title: 'Wiki Vital Chat',
  description: 'A web-based, LLM-powered chatbot for exploring, learning, and asking follow-up questions about the top 10,000 vital topics on Wikipedia',
  icons: {
    icon: '/bot_light.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}