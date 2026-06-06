import { AppLayout } from '../components/Layout';
import { NearbyTab } from './AdminPage';

const AdminNearbyPage = () => (
  <AppLayout title="Najbliższe apteki" subtitle="Weryfikacja utworzonych aptek">
    <div className="max-w-6xl">
      <NearbyTab />
    </div>
  </AppLayout>
);

export default AdminNearbyPage;
