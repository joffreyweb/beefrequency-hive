/**
 * kDrive Infomaniak — Integration client
 *
 * Documentation : https://developer.infomaniak.com/docs/api/kdrive
 *
 * Variables .env requises :
 * - INFOMANIAK_API_TOKEN
 * - INFOMANIAK_DRIVE_ID
 *
 * Structure dossier par client :
 * /BeeFrequency/Clients/[NOM-PRENOM-ID]/
 *   ├── Contrats/
 *   ├── Onboarding/
 *   ├── Videos/
 *   ├── Sessions/
 *   └── RGPD/
 */

const API_BASE = "https://api.infomaniak.com/2";

function getHeaders() {
  const token = process.env.INFOMANIAK_API_TOKEN;
  if (!token) throw new Error("INFOMANIAK_API_TOKEN non configure");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function getDriveId(): string {
  const id = process.env.INFOMANIAK_DRIVE_ID;
  if (!id) throw new Error("INFOMANIAK_DRIVE_ID non configure");
  return id;
}

/** Verifier si kDrive est configure */
export function isKDriveConfigured(): boolean {
  return !!(process.env.INFOMANIAK_API_TOKEN && process.env.INFOMANIAK_DRIVE_ID);
}

/** Trouver un sous-dossier par nom dans un dossier parent */
async function findChildFolder(parentId: string, name: string): Promise<string | null> {
  const driveId = getDriveId();
  const res = await fetch(`${API_BASE}/drive/${driveId}/files/${parentId}/files?type=dir`, {
    headers: getHeaders(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const folder = data.data?.find((f: { name: string }) => f.name === name);
  return folder?.id ?? null;
}

/** Creer un dossier sur kDrive (ou retourner l'existant) */
async function createFolder(parentId: string, name: string): Promise<string> {
  const driveId = getDriveId();
  const res = await fetch(`${API_BASE}/drive/${driveId}/files/${parentId}/directory`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const errorText = await res.text();

    // Le dossier existe deja — on recupere son ID
    if (errorText.includes("destination_already_exists")) {
      const existingId = await findChildFolder(parentId, name);
      if (existingId) return existingId;
    }

    throw new Error(`kDrive createFolder failed: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return data.data.id;
}

/** Chercher un dossier par chemin */
async function findFolderByPath(path: string): Promise<string | null> {
  const driveId = getDriveId();
  const res = await fetch(`${API_BASE}/drive/${driveId}/files/search?query=${encodeURIComponent(path)}&types=dir`, {
    headers: getHeaders(),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.[0]?.id || null;
}

/**
 * Creer la structure de dossiers pour un nouveau client
 *
 * /BeeFrequency/Clients/[NOM-PRENOM-ID]/
 *   ├── Contrats/
 *   ├── Onboarding/
 *   ├── Videos/
 *   ├── Sessions/
 *   └── RGPD/
 */
export async function createClientFolder(clientName: string, clientId: string): Promise<{ rootFolderId: string } | null> {
  if (!isKDriveConfigured()) {
    console.warn("[kDrive] Non configure — creation dossier ignoree");
    return null;
  }

  try {
    const driveId = getDriveId();

    // Trouver ou creer /BeeFrequency
    let bfId = await findFolderByPath("BeeFrequency");
    if (!bfId) {
      // Creer a la racine (root = 1)
      bfId = await createFolder("1", "BeeFrequency");
    }

    // Trouver ou creer /BeeFrequency/Clients
    let clientsId = await findFolderByPath("Clients");
    if (!clientsId) {
      clientsId = await createFolder(bfId, "Clients");
    }

    // Creer le dossier client
    const sanitizedName = clientName.replace(/[^a-zA-ZÀ-ÿ0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    const folderName = `${sanitizedName}-${clientId.substring(0, 8)}`;
    const rootFolderId = await createFolder(clientsId, folderName);

    // Creer les sous-dossiers
    await Promise.all([
      createFolder(rootFolderId, "Contrats"),
      createFolder(rootFolderId, "Onboarding"),
      createFolder(rootFolderId, "Videos"),
      createFolder(rootFolderId, "Sessions"),
      createFolder(rootFolderId, "RGPD"),
    ]);

    console.log(`[kDrive] Dossier client cree: ${folderName}`);
    return { rootFolderId };
  } catch (error) {
    console.error("[kDrive] Erreur creation dossier client:", error);
    return null;
  }
}

/** Uploader un fichier dans un dossier kDrive */
export async function uploadToKDrive(folderId: string, fileName: string, content: Buffer): Promise<boolean> {
  if (!isKDriveConfigured()) return false;

  try {
    const driveId = getDriveId();
    // Infomaniak kDrive upload API — multipart form-data with file
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(content)]);
    formData.append("file", blob, fileName);

    const res = await fetch(`${API_BASE}/drive/${driveId}/files/${folderId}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.INFOMANIAK_API_TOKEN}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[kDrive] Upload failed ${res.status}: ${errText}`);
      return false;
    }

    console.log(`[kDrive] Upload OK: ${fileName} → folder ${folderId}`);
    return true;
  } catch (error) {
    console.error("[kDrive] Erreur upload:", error);
    return false;
  }
}

/** Trouver le sous-dossier d'un client par nom (Contrats, Videos, etc.) */
export async function getClientSubfolder(rootFolderId: string, subfolderName: string): Promise<string | null> {
  return findChildFolder(rootFolderId, subfolderName);
}
