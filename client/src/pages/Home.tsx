import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useBooks } from "@/hooks/use-books";
import { BookCard } from "@/components/ui/book-card";
import { BookOpen, Star, Sparkles, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { t } = useLanguage();
  const { data: books, isLoading } = useBooks();

  const featuredBooks = books?.slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen page-transition">
      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground py-20 md:py-32 overflow-hidden">
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight">
            {t("اكتشف عالماً من المعرفة", "Discover a World of Knowledge")}
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t(
              "مكتبة الوراق تقدم لك نخبة من أفضل الكتب العربية والعالمية. تصفح مجموعتنا المختارة بعناية.",
              "Al-Warraq Bookstore offers you a selection of the best Arabic and international books. Browse our carefully curated collection."
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/store">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20 text-lg px-8">
                {t("تصفح الكتب", "Browse Books")}
              </Button>
            </Link>
            <Link href="/store?category=new">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-white/10 text-lg px-8">
                {t("الإصدارات الجديدة", "New Releases")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t("مجموعة متنوعة", "Diverse Collection")}</h3>
              <p className="text-muted-foreground">{t("آلاف الكتب في شتى المجالات", "Thousands of books in various fields")}</p>
            </div>
            <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-4">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t("جودة عالية", "High Quality")}</h3>
              <p className="text-muted-foreground">{t("كتب أصلية وطبعات فاخرة", "Original books and premium editions")}</p>
            </div>
            <div className="bg-card p-6 rounded-xl border shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-600 mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t("شحن سريع", "Fast Shipping")}</h3>
              <p className="text-muted-foreground">{t("توصيل لكافة الولايات", "Delivery to all states")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-serif font-bold text-primary mb-2 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-accent" />
                {t("كتب مختارة", "Featured Books")}
              </h2>
              <p className="text-muted-foreground">
                {t("أحدث الإضافات إلى مكتبتنا", "Latest additions to our library")}
              </p>
            </div>
            <Link href="/store">
              <Button variant="outline" className="text-accent font-bold">
                {t("عرض الكل", "View All")} &rarr;
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="w-full aspect-[2/3] rounded-lg" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : (
              featuredBooks?.map((book: any) => (
                <BookCard key={book.id} book={book} />
              ))
            )}
          </div>
        </div>
      </section>
      
      {/* Newsletter / CTA */}
      <section className="py-20 container mx-auto px-4">
        <div className="bg-primary rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 max-w-2xl mx-auto">
             <h2 className="text-3xl font-serif font-bold text-white mb-4">
               {t("انضم إلى مجتمع القراء", "Join Our Community of Readers")}
             </h2>
             <p className="text-primary-foreground/80 mb-8">
               {t("اشترك في نشرتنا البريدية للحصول على آخر الأخبار والعروض الحصرية.", "Subscribe to our newsletter for the latest news and exclusive offers.")}
             </p>
             <div className="flex flex-col sm:flex-row gap-3 justify-center">
               <input 
                 type="email" 
                 placeholder={t("بريدك الإلكتروني", "Your email address")}
                 className="px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:bg-white/20 w-full sm:w-auto min-w-[300px]"
               />
               <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                 {t("اشترك", "Subscribe")}
               </Button>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
