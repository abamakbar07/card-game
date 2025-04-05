import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Domino Masters</CardTitle>
          <CardDescription className="text-center">Play dominoes with friends online</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/create" className="w-full">
            <Button className="w-full" size="lg">
              Create New Game
            </Button>
          </Link>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-100 px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          <Link href="/join" className="w-full">
            <Button variant="outline" className="w-full" size="lg">
              Join Existing Game
            </Button>
          </Link>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">Play on any device, anywhere</p>
        </CardFooter>
      </Card>
    </div>
  )
}

