import { useQuery, useMutation } from "@tanstack/react-query";
import { Asset } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PixelEditor } from "@/components/editor/pixel-editor";

export default function PixelEditorPage() {
    const [, params] = useRoute("/assets/:id/edit");
    const id = params?.id;

    const { data: asset, isLoading } = useQuery<Asset>({
        queryKey: [`/api/assets/${id}`],
        enabled: !!id,
    });

    const saveAssetMutation = useMutation({
        mutationFn: async (content: any) => {
            const res = await apiRequest("PUT", `/api/assets/${id}`, { content });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/assets/${id}`] });
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!asset) {
        return <div>Asset not found</div>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="border-b p-4 flex items-center gap-4">
                <Link href={`/projects/${asset.projectId}`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl font-bold">{asset.name}</h1>
                    <p className="text-xs text-muted-foreground">{asset.type} editor</p>
                </div>
            </header>

            <main className="flex-1 p-8 flex justify-center">
                {asset.type === "pixel" ? (
                    <PixelEditor
                        initialContent={asset.content}
                        onSave={async (content) => {
                            await saveAssetMutation.mutateAsync(content);
                        }}
                    />
                ) : (
                    <div className="text-center text-muted-foreground">
                        Editor for {asset.type} not implemented yet.
                    </div>
                )}
            </main>
        </div>
    );
}
