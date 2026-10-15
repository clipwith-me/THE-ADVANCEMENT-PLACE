import Image from "next/image";
import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import mark from "../../../public/brand/logo-mark.png";
import lockup from "../../../public/brand/logo-lockup.png";

/**
 * The supplied logo, used as-is (cropped from the client's artwork, never
 * redrawn or re-lettered). At header size the full lockup's lettering would
 * be illegible, so the header pairs the unaltered mark with the business name
 * set as text. Request a horizontal vector lockup from the client to replace this.
 */
export function HeaderLogo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-md" aria-label={`${BUSINESS.name} — home`}>
      <Image src={mark} alt="" priority className="h-10 w-auto sm:h-11" sizes="48px" />
      <span className="font-display text-[1.05rem] leading-[1.05] font-semibold text-ink-900 sm:text-lg">
        The Advancement
        <br />
        Place
      </span>
    </Link>
  );
}

export function FullLogo({ className = "h-32 w-auto" }: { className?: string }) {
  return <Image src={lockup} alt={BUSINESS.name} className={className} sizes="320px" />;
}

export function LogoMark({ className = "h-10 w-auto" }: { className?: string }) {
  return <Image src={mark} alt="" className={className} sizes="64px" />;
}
