export interface CampusLocationDetail {
  parent: string;
  adjacent: string[];
}

export const campusLocations: Record<string, CampusLocationDetail> = {
  library: {
    parent: "academic_area",
    adjacent: ["library_entrance", "study_hall"],
  },
  library_entrance: {
    parent: "academic_area",
    adjacent: ["library", "main_building"],
  },
  study_hall: {
    parent: "academic_area",
    adjacent: ["library", "main_building"],
  },
  main_building: {
    parent: "academic_area",
    adjacent: ["library_entrance", "study_hall", "cafeteria"],
  },
  cafeteria: {
    parent: "student_center",
    adjacent: ["coffee_shop", "bookstore", "main_building"],
  },
  coffee_shop: {
    parent: "student_center",
    adjacent: ["cafeteria", "bookstore"],
  },
  bookstore: {
    parent: "student_center",
    adjacent: ["cafeteria", "coffee_shop"],
  },
  gymnasium: {
    parent: "sports_area",
    adjacent: ["football_field", "swimming_pool"],
  },
  football_field: {
    parent: "sports_area",
    adjacent: ["gymnasium"],
  },
  swimming_pool: {
    parent: "sports_area",
    adjacent: ["gymnasium"],
  },
  dormitory: {
    parent: "residential_area",
    adjacent: ["student_center"],
  },
};
