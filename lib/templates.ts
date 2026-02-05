export type RoomTemplate = {
  id: string
  name: string
  options: string[]
}

export const templates: RoomTemplate[] = [
  {
    id: "dinner",
    name: "Dinner",
    options: ["Tacos", "Sushi", "Pizza", "Burgers", "Thai", "Ramen"]
  },
  {
    id: "drinks",
    name: "Drinks",
    options: ["Cocktails", "Beer", "Wine", "Mocktails", "Shots", "Water (lol)"]
  },
  {
    id: "who-pays",
    name: "Who Pays",
    options: ["Alex", "Sam", "Taylor", "Jordan", "Split it", "The house"]
  }
]

export function getTemplateById(id: string | null): RoomTemplate | null {
  if (!id) return null
  return templates.find((t) => t.id === id) ?? null
}

