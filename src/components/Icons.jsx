function Icon({ size = 20, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function LogoEmblem(props) {
  return <Icon {...props}><path d="m10 2-8 4 8 4 8-4-8-4Zm-8 8 8 4 8-4m-16 4 8 4 8-4" /></Icon>;
}

export function SparkleIcon(props) {
  return <Icon {...props}><path d="M10 2a8 8 0 0 0 8 8 8 8 0 0 0-8 8 8 8 0 0 0-8-8 8 8 0 0 0 8-8Z" /></Icon>;
}

export function CheckIcon(props) {
  return <Icon {...props}><path d="m3.5 10 4 4 9-9" /></Icon>;
}

export function CheckCircleIcon(props) {
  return (
    <Icon {...props}>
      <path d="M17.5 10a7.5 7.5 0 1 1-4.5-6.9M7 9.5l3 3 7-7" />
    </Icon>
  );
}

export function ArrowRightIcon(props) {
  return <Icon {...props}><path d="M3.5 10h13m-5.5-5.5L16.5 10 11 15.5" /></Icon>;
}

export function ArrowUpIcon(props) {
  return <Icon {...props}><path d="M10 16.5v-13M4.5 9 10 3.5 15.5 9" /></Icon>;
}

export function PhoneIcon(props) {
  return (
    <Icon {...props}>
      <path d="M5.4 2.5H4A1.5 1.5 0 0 0 2.5 4.2c.8 7.1 6.2 12.5 13.3 13.3a1.5 1.5 0 0 0 1.7-1.5v-1.4a1.5 1.5 0 0 0-1.2-1.5l-2.4-.5a1.5 1.5 0 0 0-1.4.4l-1.1 1.1a12 12 0 0 1-5.5-5.5L7 7.5a1.5 1.5 0 0 0 .4-1.4l-.5-2.4a1.5 1.5 0 0 0-1.5-1.2Z" />
    </Icon>
  );
}

export function PinIcon(props) {
  return (
    <Icon {...props}>
      <path d="M16.5 8.5c0 5-6.5 9-6.5 9s-6.5-4-6.5-9a6.5 6.5 0 1 1 13 0Z" />
      <circle cx="10" cy="8.5" r="2.2" />
    </Icon>
  );
}

export function MailIcon(props) {
  return (
    <Icon {...props}>
      <rect x="2" y="4" width="16" height="12" rx="1.5" />
      <path d="m2.5 5 7.5 6 7.5-6" />
    </Icon>
  );
}

export function ClockIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.5v4.7l3 1.8" />
    </Icon>
  );
}

export function CalendarIcon(props) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="4" width="15" height="13.5" rx="1.5" />
      <path d="M6 2.5v3M14 2.5v3M2.5 8h15" />
    </Icon>
  );
}

export function ShieldIcon(props) {
  return <Icon {...props}><path d="M10 2.5 3.5 5v4.5c0 3.6 2.8 6.3 6.5 8 3.7-1.7 6.5-4.4 6.5-8V5L10 2.5Z" /></Icon>;
}

export function ShieldCheckIcon(props) {
  return (
    <Icon {...props}>
      <path d="M10 2.5 3.5 5v4.5c0 3.6 2.8 6.3 6.5 8 3.7-1.7 6.5-4.4 6.5-8V5L10 2.5Zm-2.5 7 1.8 1.8 3.5-3.5" />
    </Icon>
  );
}

export function LockIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="9" width="14" height="8.5" rx="1.5" />
      <path d="M6 9V6.5a4 4 0 0 1 8 0V9" />
    </Icon>
  );
}

export function AlertTriangleIcon(props) {
  return (
    <Icon {...props}>
      <path d="M8.7 3.8 2.3 15a1.5 1.5 0 0 0 1.3 2.2h12.8a1.5 1.5 0 0 0 1.3-2.2L11.3 3.8a1.5 1.5 0 0 0-2.6 0ZM10 8v3m0 3h.01" />
    </Icon>
  );
}

export function InfoIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9v4.5m0-7h.01" />
    </Icon>
  );
}

export function CloseIcon(props) {
  return <Icon {...props}><path d="m5 5 10 10M15 5 5 15" /></Icon>;
}

export function PlusIcon(props) {
  return <Icon {...props}><path d="M10 4v12M4 10h12" /></Icon>;
}

export function MinusIcon(props) {
  return <Icon {...props}><path d="M4 10h12" /></Icon>;
}

export function CarIcon(props) {
  return (
    <Icon {...props}>
      <path d="M6 14h8m3 0h.5a1 1 0 0 0 1-1v-1.4a2 2 0 0 0-1.6-2l-2.5-.5-2.2-2.4a2 2 0 0 0-1.5-.7H6.5a2 2 0 0 0-1.7 1L3 9.7a3 3 0 0 0-1.5 2.6v.7a1 1 0 0 0 1 1H3" />
      <circle cx="4.5" cy="14" r="1.5" />
      <circle cx="15.5" cy="14" r="1.5" />
    </Icon>
  );
}

export function CoffeeIcon(props) {
  return (
    <Icon {...props}>
      <path d="M3 7h11v5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7Zm11 1h1.5a2.5 2.5 0 0 1 0 5H14M2 17.5h13M6 2.5v2m2.5-2v2m2.5-2v2" />
    </Icon>
  );
}

export function ZapIcon(props) {
  return <Icon {...props}><path d="M11.5 2 3.5 11h6l-1 7 8-9h-6l1-7Z" /></Icon>;
}

export function TrophyIcon(props) {
  return (
    <Icon {...props}>
      <path d="M6 3h8v6a4 4 0 0 1-8 0V3Zm0 1.5H3v2A3 3 0 0 0 6 9m8-4.5h3v2A3 3 0 0 1 14 9m-4 4v4m-3 0h6" />
    </Icon>
  );
}

export function GemIcon(props) {
  return <Icon {...props}><path d="M5 4h10l3 5-8 8-8-8 3-5Zm-3 5h16M8.5 4 7 9l3 8 3-8-1.5-5" /></Icon>;
}

export function CameraIcon(props) {
  return (
    <Icon {...props}>
      <rect x="2" y="4.5" width="12" height="11" rx="1.5" />
      <path d="m14 8 4-2.5v9L14 12" />
    </Icon>
  );
}

export function FileCheckIcon(props) {
  return (
    <Icon {...props}>
      <path d="M5.5 2.5h6l4 4V16a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 16V4a1.5 1.5 0 0 1 1.5-1.5Zm6 0v4h4m-8 6 1.5 1.5 3-3" />
    </Icon>
  );
}

export function CreditCardIcon(props) {
  return (
    <Icon {...props}>
      <rect x="2" y="4.5" width="16" height="11" rx="1.5" />
      <path d="M2 8.5h16" />
    </Icon>
  );
}

export function SnowflakeIcon(props) {
  return (
    <Icon {...props}>
      <path d="M10 2.5v15M3.5 6.25l13 7.5m0-7.5-13 7.5M8.5 3.5 10 5l1.5-1.5m-3 13L10 15l1.5 1.5M3.5 8l2-.5-.5-2m10 9 .5-2 2 .5m-14 0 2-.5-.5 2m10-9 .5 2 2 .5" />
    </Icon>
  );
}

export function BuildingIcon(props) {
  return <Icon {...props}><path d="M2.5 17.5h15M4.5 9v8m3.5-8v8m4-8v8m3.5-8v8M2 8l8-5 8 5H2Z" /></Icon>;
}

export function SendIcon(props) {
  return <Icon {...props}><path d="M17.5 2.5 12 17.5l-3.3-6.2L2.5 8l15-5.5Zm0 0-8.8 8.8" /></Icon>;
}

export function MessageSquareIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 3h12a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 16 14H7l-4.5 3V4.5A1.5 1.5 0 0 1 4 3Z" />
    </Icon>
  );
}

export function MenuIcon(props) {
  return <Icon {...props}><path d="M3 5h14M3 10h14M3 15h14" /></Icon>;
}
