import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function MenuCard({ menu, onAdd }) {
  const { name, price, description } = menu

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>{price.toLocaleString()}원</p>
      </CardContent>
      <CardFooter>
        <Button onClick={onAdd}>담기</Button>
      </CardFooter>
    </Card>
  )
}
