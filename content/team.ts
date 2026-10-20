import type { ContentMedia } from "@/content/site";

export type TeamMemberId = "santino" | "tobias";

export interface TeamMember {
  id: TeamMemberId;
  name: string;
  role: string;
  bio: string | null;
  focus: string[] | null;
  pendingFocus: string[];
  focusConfirmed: boolean;
  portrait: ContentMedia;
  alternatePortrait: ContentMedia;
}

export const teamCopy = { title: ["DOS MIRADAS.", "UN MISMO EQUIPO."] } as const;

export const team: readonly TeamMember[] = [
  {
    id: "santino",
    name: "Santino Dacuy",
    role: "Analista en Sistemas · Licenciatura en Sistemas de Información en curso",
    bio: null,
    focus: null,
    pendingFocus: ["Diseño", "UX/UI", "Contenido", "Backend y datos"],
    focusConfirmed: false,
    portrait: { src: "/team/santino-01.webp", width: 1800, height: 2250, alt: "" },
    alternatePortrait: { src: "/team/santino-02.webp", width: 1800, height: 2250, alt: "" },
  },
  {
    id: "tobias",
    name: "Tobías Carballo",
    role: "Analista en Sistemas · Licenciatura en Sistemas de Información en curso",
    bio: null,
    focus: null,
    pendingFocus: ["Desarrollo web", "Bases de datos"],
    focusConfirmed: false,
    portrait: { src: "/team/tobias-01.webp", width: 1800, height: 2250, alt: "" },
    alternatePortrait: { src: "/team/tobias-02.webp", width: 1800, height: 2250, alt: "" },
  },
];
