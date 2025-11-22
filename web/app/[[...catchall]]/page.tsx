import { PlasmicComponent } from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "../../plasmic-init";
import { notFound } from "next/navigation";
import { PlasmicClientRootProvider } from "../../components/PlasmicClientRootProvider";

// This page will handle all routes that aren't handled by other pages.
export default async function PlasmicLoaderPage({
    params,
    searchParams,
}: {
    params: { catchall?: string[] };
    searchParams?: Record<string, string | string[]>;
}) {
    const plasmicData = await PLASMIC.fetchComponentData(
        params.catchall ? "/" + params.catchall.join("/") : "/"
    );

    if (!plasmicData) {
        notFound();
    }

    return (
        <PlasmicClientRootProvider
            prefetchedData={plasmicData}
            componentName={plasmicData.entryCompMetas[0].name}
        />
    );
}
