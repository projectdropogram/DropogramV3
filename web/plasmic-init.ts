import { initPlasmicLoader } from "@plasmicapp/loader-nextjs/react-server-conditional";

console.log("PLASMIC_PROJECT_ID:", process.env.PLASMIC_PROJECT_ID);

export const PLASMIC = initPlasmicLoader({
    projects: [
        {
            id: process.env.PLASMIC_PROJECT_ID || "PROJECTID", // ID of a project you are using
            token: process.env.PLASMIC_API_TOKEN || "APITOKEN", // API token for that project
        },
    ],

    // By default Plasmic will preview the last published version of your project.
    // For development, you can set preview to true, which will use the unpublished
    // project, allowing you to see your designs without publishing.  Please
    // only use this for development, as this is significantly slower.
    preview: true,
});


