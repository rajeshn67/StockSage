const TestStyles = () => {
  return (
    <div className="p-8 bg-blue-50 border border-blue-200 rounded-lg">
      <h1 className="text-2xl font-bold text-blue-900 mb-4">Tailwind Test</h1>
      <button className="btn btn-primary mr-4">Primary Button</button>
      <button className="btn btn-secondary">Secondary Button</button>
      <div className="mt-4">
        <input className="input" placeholder="Test input field" />
      </div>
      <div className="card mt-4">
        <div className="card-header">
          <h3 className="text-lg font-medium">Test Card</h3>
        </div>
        <div className="card-content">
          <p className="text-gray-600">If you can see this styled properly, Tailwind is working!</p>
        </div>
      </div>
    </div>
  )
}

export default TestStyles
