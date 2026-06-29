import Link from 'next/link'

const CATEGORIES = [
  {
    slug: 'mechanics',
    name: 'Mechanics',
    description: 'Explore services and products related to Mechanics.',
    emoji: '🔧',
  },
  {
    slug: 'paddy-transplantors',
    name: 'Paddy Transplantors',
    description: 'Explore services and products related to Paddy Transplantors.',
    emoji: '🌾',
  },
  {
    slug: 'drones',
    name: 'Drones',
    description: 'Explore services and products related to Drones.',
    emoji: '🚁',
  },
  {
    slug: 'harvestors',
    name: 'Harvestors',
    description: 'Explore services and products related to Harvestors.',
    emoji: '🚜',
  },
  {
    slug: 'agriculture-labor',
    name: 'Agriculture Labor',
    description: 'Explore services and products related to Agriculture Labor.',
    emoji: '👨‍🌾',
  },
  {
    slug: 'earth-movers',
    name: 'Earth Movers',
    description: 'Explore services and products related to Earth Movers.',
    emoji: '🏗️',
  },
  {
    slug: 'implements',
    name: 'Implements',
    description: 'Explore services and products related to Implements.',
    emoji: '⚙️',
  },
  {
    slug: 'machines',
    name: 'Machines',
    description: 'Explore services and products related to Machines.',
    emoji: '🚛',
  },
  {
    slug: 'technician',
    name: 'Technician',
    description: 'Explore services and products related to Technician.',
    emoji: '👷',
  },
]

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-100">

      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-10">
          Business Categories
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.slug}
              className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              {/* Icon placeholder — replace with <Image src={cat.image} … /> */}
              <div className="h-36 bg-gray-50 rounded-xl flex items-center justify-center text-5xl">
                {cat.emoji}
              </div>

              <div className="flex flex-col gap-1">
                <h2 className="font-semibold text-gray-900 text-base">{cat.name}</h2>
                <p className="text-sm text-gray-500 leading-snug">{cat.description}</p>
              </div>

              <Link
                href={`/categories/${cat.slug}`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-auto"
              >
                Go to Product Profile
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}