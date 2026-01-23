import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-6xl font-bold text-muted-foreground">
            404
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="mb-2 text-xl font-semibold">Page not found</h2>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
