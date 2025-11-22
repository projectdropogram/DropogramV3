import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";

export const PLASMIC_CLIENT = initPlasmicLoader({
    projects: [
        {
            id: process.env.NEXT_PUBLIC_PLASMIC_PROJECT_ID!,
            token: process.env.NEXT_PUBLIC_PLASMIC_API_TOKEN!,
        },
    ],
    preview: true,
});
