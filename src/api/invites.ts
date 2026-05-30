import { api } from './client';

export const invitesApi = {
    create: (recipientEmail: string, contactIds: string[] = []) =>
        api<{ ok: boolean; inviteLink: string; emailSent: boolean; message: string }>(
            '/api/v1/invites',
            { method: 'POST', body: JSON.stringify({ recipientEmail, contactIds }) }
        ),
};
