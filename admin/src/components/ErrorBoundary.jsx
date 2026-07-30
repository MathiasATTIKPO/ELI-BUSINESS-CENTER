import React from 'react'
import { useLocation } from 'react-router-dom'
import ErrorPage from '../pages/ErrorPage'

class ErrorBoundaryCore extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  componentDidUpdate(previousProps) {
    if (
      this.state.hasError
      && previousProps.resetKey !== this.props.resetKey
    ) {
      this.setState({ hasError: false })
    }
  }

  resetError = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return <ErrorPage type="500" onReset={this.resetError} />
    }
    return this.props.children
  }
}

export default function ErrorBoundary({ children }) {
  const location = useLocation()
  const resetKey = `${location.pathname}${location.search}${location.hash}`

  return (
    <ErrorBoundaryCore resetKey={resetKey}>
      {children}
    </ErrorBoundaryCore>
  )
}
