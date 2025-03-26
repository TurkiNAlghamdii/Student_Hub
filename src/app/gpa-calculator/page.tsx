import { Metadata } from 'next'
import GpaCalculatorClient from './GpaCalculatorClient'

export const metadata: Metadata = {
  title: 'GPA Calculator | Student Hub',
  description: 'Calculate your GPA and track your academic progress',
}

export default function GpaCalculatorPage() {
  return <GpaCalculatorClient />
} 