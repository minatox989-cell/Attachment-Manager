import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Wrench, Zap, PaintBucket, Hammer, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32 bg-background">
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-300/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            Now live in your city
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground mb-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Find the perfect help for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">daily tasks.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Connect with verified local professionals for plumbing, electrical, cleaning, and more. Fast, reliable, and secure.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Link href="/auth">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                Find a Professional
              </Button>
            </Link>
            <Link href="/auth?tab=register">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2">
                Become a Worker
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-display mb-4">Popular Services</h2>
            <p className="text-muted-foreground">Everything you need to maintain your home</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Wrench, label: "Plumbing", color: "text-blue-500", bg: "bg-blue-50" },
              { icon: Zap, label: "Electrical", color: "text-yellow-500", bg: "bg-yellow-50" },
              { icon: Hammer, label: "Carpentry", color: "text-amber-700", bg: "bg-amber-50" },
              { icon: PaintBucket, label: "Painting", color: "text-purple-500", bg: "bg-purple-50" },
            ].map((item, i) => (
              <Card key={i} className="group hover:shadow-lg transition-all duration-300 border-none shadow-sm cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <div className={`w-16 h-16 rounded-2xl ${item.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className={`w-8 h-8 ${item.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg">{item.label}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur-2xl opacity-50" />
              {/* Unsplash image of a happy handyman working */}
              {/* home repair worker smiling portrait */}
              <img 
                src="https://pixabay.com/get/g0dc328d1255c9211683dbfa853dbeac5d7ad9f346afd92ff355aeb7c28f52870bb12d4ef37fe512978a1ff3c0b628deb49cc6c14254605a5ebdefd27730dd03f_1280.jpg" 
                alt="Professional Worker" 
                className="relative rounded-2xl shadow-2xl w-full object-cover aspect-square"
              />
              <div className="absolute -bottom-6 -right-6 bg-card p-6 rounded-xl shadow-xl border border-border animate-float">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">Verified Pro</p>
                    <p className="text-xs text-muted-foreground">Background Checked</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <h2 className="text-4xl font-display font-bold">Why choose CrewHub?</h2>
              <div className="space-y-6">
                {[
                  { title: "Verified Professionals", desc: "Every worker passes a background check before joining." },
                  { title: "Transparent Pricing", desc: "See visiting charges upfront. No hidden fees." },
                  { title: "Secure Booking", desc: "Book appointments and track status in real-time." },
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-xl">{i + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="bg-background text-foreground p-1.5 rounded-lg">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold font-display">CrewHub</span>
            </div>
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} CrewHub Inc. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
