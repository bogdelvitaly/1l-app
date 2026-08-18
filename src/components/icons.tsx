// Small monochrome UI icons as inline SVG using currentColor, so they follow
// the theme (unlike the static-colored <img> assets in public/icons/figma,
// which are fine for theme-invariant spots like the sidebar).
type IconProps = { className?: string };

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" fill="none" className={className}>
      <path
        d="M8.88338 0.0067277L9 0C9.51284 0 9.93551 0.38604 9.99327 0.883379L10 1V8H17C17.5128 8 17.9355 8.38604 17.9933 8.88338L18 9C18 9.51284 17.614 9.93551 17.1166 9.99327L17 10H10V17C10 17.5128 9.61396 17.9355 9.11662 17.9933L9 18C8.48716 18 8.06449 17.614 8.00673 17.1166L8 17V10H1C0.487164 10 0.0644928 9.61396 0.0067277 9.11662L0 9C0 8.48716 0.38604 8.06449 0.883379 8.00673L1 8H8V1C8 0.487164 8.38604 0.0644928 8.88338 0.0067277L9 0L8.88338 0.0067277Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PenIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 15.9983 15.9989" width="20" height="20" fill="none" className={className}>
      <path
        d="M15.1794 0.924939C14.0271 -0.286904 12.1027 -0.311179 10.9203 0.871215L1.54545 10.2456C1.21763 10.5734 0.990085 10.9879 0.889529 11.4405L0.0119121 15.3904C-0.0251689 15.5573 0.02559 15.7316 0.146489 15.8524C0.267387 15.9733 0.441665 16.024 0.608549 15.9869L4.53494 15.1138C5.00237 15.0098 5.43048 14.7748 5.76907 14.4362L13.7497 6.45548L14.0858 6.79159C14.4763 7.18211 14.4763 7.81528 14.0858 8.2058L13.1464 9.14514C12.9512 9.3404 12.9512 9.65699 13.1464 9.85225C13.3417 10.0475 13.6583 10.0475 13.8536 9.85225L14.7929 8.91291C15.5739 8.13186 15.5739 6.86553 14.7929 6.08448L14.4568 5.74837L15.1271 5.07808C16.2681 3.93704 16.2913 2.09436 15.1794 0.924939ZM11.6274 1.57834C12.4123 0.793431 13.6898 0.809545 14.4547 1.614C15.1928 2.3903 15.1774 3.61352 14.42 4.37097L5.06196 13.7291C4.85781 13.9332 4.59969 14.0749 4.31786 14.1376L1.15855 14.8402L1.86572 11.6574C1.92502 11.3905 2.05921 11.146 2.25254 10.9527L11.6274 1.57834Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 14.3332 14.3333" width="16" height="16" fill="none" className={className}>
      <path
        d="M6.42593 12.3519C9.69873 12.3519 12.3519 9.69873 12.3519 6.42593C12.3519 3.15313 9.69873 0.5 6.42593 0.5C3.15313 0.5 0.5 3.15313 0.5 6.42593C0.5 9.69873 3.15313 12.3519 6.42593 12.3519Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.8332 13.8333L10.611 10.6111" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 7 4" width="12" height="12" fill="none" className={className}>
      <path d="M0.5 0.5L3.5 3.5L6.5 0.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Base path geometry points right; Arrow Left flips it (matches Figma's own
// "-scale-x-100" wrapper on its Arrow Left component).
export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 11.5 10.871" width="14" height="14" fill="none" className={className} style={{ transform: "scaleX(-1)" }}>
      <path d="M6.06449 0.5L11 5.43551L6.06449 10.371" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.9999 5.43551L0.5 5.43551" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 11.5 10.871" width="14" height="14" fill="none" className={className}>
      <path d="M6.06449 0.5L11 5.43551L6.06449 10.371" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.9999 5.43551L0.5 5.43551" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" className={className}>
      <path
        d="M4 8C4.55228 8 5 7.55229 5 7C5 6.44771 4.55228 6 4 6C3.44772 6 3 6.44771 3 7C3 7.55229 3.44772 8 4 8ZM5 10C5 10.5523 4.55228 11 4 11C3.44772 11 3 10.5523 3 10C3 9.44771 3.44772 9 4 9C4.55228 9 5 9.44771 5 10ZM7 8C7.55229 8 8 7.55229 8 7C8 6.44771 7.55229 6 7 6C6.44771 6 6 6.44771 6 7C6 7.55229 6.44771 8 7 8ZM8 10C8 10.5523 7.55229 11 7 11C6.44771 11 6 10.5523 6 10C6 9.44771 6.44771 9 7 9C7.55229 9 8 9.44771 8 10ZM10 8C10.5523 8 11 7.55229 11 7C11 6.44771 10.5523 6 10 6C9.44771 6 9 6.44771 9 7C9 7.55229 9.44771 8 10 8ZM14 2.5C14 1.11929 12.8807 0 11.5 0H2.5C1.11929 0 0 1.11929 0 2.5V11.5C0 12.8807 1.11929 14 2.5 14H11.5C12.8807 14 14 12.8807 14 11.5V2.5ZM1 4H13V11.5C13 12.3284 12.3284 13 11.5 13H2.5C1.67157 13 1 12.3284 1 11.5V4ZM2.5 1H11.5C12.3284 1 13 1.67157 13 2.5V3H1V2.5C1 1.67157 1.67157 1 2.5 1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 14" width="20" height="14" fill="none" className={className}>
      <path d="M0 1H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M0 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M0 13H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" className={className}>
      <path d="M8 0V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M0 8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IosArrowIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 10 10" width="10" height="10" fill="none" className={className}>
      <path
        d="M2.43426 1.5361C2.27625 1.3688 2.28378 1.10509 2.45108 0.947084C2.61837 0.789076 2.88208 0.796606 3.04009 0.963903L6.58189 4.7139C6.73355 4.87448 6.73356 5.12549 6.58191 5.28608L3.04011 9.03668C2.88212 9.20399 2.61841 9.21154 2.4511 9.05354C2.28379 8.89555 2.27624 8.63184 2.43424 8.46453L5.70586 5.00002L2.43426 1.5361Z"
        fill="currentColor"
      />
    </svg>
  );
}
