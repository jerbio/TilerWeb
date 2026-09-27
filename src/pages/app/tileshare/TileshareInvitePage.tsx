import { useParams } from 'react-router';
import TileShareInvitations from '@/components/tileshare/TileShareInvitations';
export default function TileshareInvitePage() {
	const { designatedTemplateId } = useParams<{ designatedTemplateId: string }>();
	return <TileShareInvitations AssignmentId={designatedTemplateId} />;
}
