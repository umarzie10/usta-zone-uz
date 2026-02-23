import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { MapPin, Phone, Mail, Facebook, Instagram, Send } from 'lucide-react';

export default function Footer() {
  const { t } = useApp();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-lg"
                style={{ background: 'var(--gradient-primary)' }}>U</div>
              <span className="font-black text-xl">
                <span className="text-gradient">Usta</span>Zone
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              {t('footerDesc')}
            </p>
            <div className="flex gap-3">
              {[Facebook, Instagram, Send].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4">{t('siteLinks')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                { href: '/', label: t('home') },
                { href: '/find-master', label: t('findMaster') },
                { href: '/categories', label: t('categories') },
                { href: '/about', label: t('about') },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">{t('legal')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                { href: '/terms', label: t('terms') },
                { href: '/privacy', label: t('privacy') },
                { href: '/about', label: t('aboutUs') },
                { href: '/contact', label: t('contact') },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">{t('contact')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                Toshkent, O'zbekiston
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                +998 97 706 62 45
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                umareshqurbonov52@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-muted-foreground">
          <p>© 2026 UstaZone. {t('allRightsReserved')}</p>
          <p>{t('commissionInfo')}</p>
        </div>
      </div>
    </footer>
  );
}
