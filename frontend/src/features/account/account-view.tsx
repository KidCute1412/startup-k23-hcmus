"use client";

import { useState } from "react";
import { ProfileOverview } from "./profile-overview";
import { AddressList } from "./address-list";

export function AccountView() {
  const [activeTab, setActiveTab] = useState<string>("profile");

  return (
    <div className="space-y-8">
      <ProfileOverview activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "addresses" && <AddressList />}
    </div>
  );
}
