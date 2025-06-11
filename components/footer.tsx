import { Github, Twitter, Globe } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              Built with ❤️ by{" "}
              <a
                href="https://github.com/EskandarAtrakchi"
                className="font-medium text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Eskandar Atrakchi
              </a>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Open source • Feel free to use and modify</p>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/EskandarAtrakchi/crypto-liquidation-calc"
              className="text-muted-foreground hover:text-primary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Globe className="h-5 w-5" />
              <span className="sr-only">Website</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
