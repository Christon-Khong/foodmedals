import { CategoryCreateForm } from './CategoryCreateForm'

export const dynamic = 'force-dynamic'

export default function NewCategoryPage() {
  return (
    <div className="max-w-2xl">
      <CategoryCreateForm />
    </div>
  )
}
