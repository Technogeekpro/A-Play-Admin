
import { AdminDashboard } from "./views/AdminDashboard";
import { EventsView } from "./views/EventsView";
import { ClubsView } from "./views/ClubsView";
import { UsersView } from "./views/UsersView";
import { FeedsView } from "./views/FeedsView";
import { BookingsView } from "./views/BookingsView";
import { PointsView } from "./views/PointsView";
import { SubscriptionsView } from "./views/SubscriptionsView";
import { ConciergeView } from "./views/ConciergeView";
import { PodcastView } from "./views/PodcastView";
import { SettingsView } from "./views/SettingsView";
import { LoungesView } from "./views/LoungesView";
import { PubsView } from "./views/PubsView";
import { ArcadeCentersView } from "./views/ArcadeCentersView";
import { BeachesView } from "./views/BeachesView";
import { LiveShowsView } from "./views/LiveShowsView";
import { CategoriesView } from "./views/CategoriesView";
import { RestaurantsView } from "./views/RestaurantsView";

interface AdminContentProps {
  activeView: string;
}

export function AdminContent({ activeView }: AdminContentProps) {
  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <AdminDashboard />;
      case "events":
        return <EventsView />;
      case "restaurants":
        return <RestaurantsView />;
      case "lounges":
        return <LoungesView />;
      case "pubs":
        return <PubsView />;
      case "arcades":
        return <ArcadeCentersView />;
      case "beaches":
        return <BeachesView />;
      case "live-shows":
        return <LiveShowsView />;
      case "clubs":
        return <ClubsView />;
      case "users":
        return <UsersView />;
      case "feeds":
        return <FeedsView />;
      case "bookings":
        return <BookingsView />;
      case "categories":
        return <CategoriesView />;
      case "points":
        return <PointsView />;
      case "subscriptions":
        return <SubscriptionsView />;
      case "concierge":
        return <ConciergeView />;
      case "podcast":
        return <PodcastView />;
      case "settings":
        return <SettingsView />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {renderView()}
      </div>
    </main>
  );
}
