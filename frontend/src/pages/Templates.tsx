export default function Templates() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-display font-bold mb-6">Templates</h1>
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card p-4 hover:border-primary-500 cursor-pointer transition">
            <div className="aspect-video bg-dark-700 rounded-lg mb-3" />
            <h3 className="font-bold">Template {i}</h3>
            <p className="text-sm text-gray-400">Click to use</p>
          </div>
        ))}
      </div>
    </div>
  );
}
