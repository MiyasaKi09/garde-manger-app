// components/NavLink.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({ href, icon, children }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className="nav-link mk-nav-link"
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="nav-icon mk-nav-ico" aria-hidden="true">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}
