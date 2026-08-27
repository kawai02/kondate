import type { CookingRating, Ingredient, MealType, SourceType, Step } from "@/lib/types";

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string;
          title: string;
          source_type: SourceType;
          source_url: string | null;
          thumbnail_url: string | null;
          raw_text: string | null;
          base_servings: number | null;
          ingredients: Ingredient[];
          steps: Step[];
          cook_time_min: number | null;
          tags: string[];
          memo: string | null;
          is_planned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          source_type: SourceType;
          source_url?: string | null;
          thumbnail_url?: string | null;
          raw_text?: string | null;
          base_servings?: number | null;
          ingredients?: Ingredient[];
          steps?: Step[];
          cook_time_min?: number | null;
          tags?: string[];
          memo?: string | null;
          is_planned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recipes"]["Insert"]>;
        Relationships: [];
      };
      recipe_scaled_cache: {
        Row: {
          id: string;
          recipe_id: string;
          servings: number;
          ingredients: Ingredient[];
          steps: Step[];
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          servings: number;
          ingredients: Ingredient[];
          steps: Step[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recipe_scaled_cache"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "recipe_scaled_cache_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_entries: {
        Row: {
          id: string;
          date: string;
          meal_type: MealType;
          recipe_id: string;
          servings: number | null;
          position: number;
          note: string | null;
        };
        Insert: {
          id?: string;
          date: string;
          meal_type?: MealType;
          recipe_id: string;
          servings?: number | null;
          position?: number;
          note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["menu_entries"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "menu_entries_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      cooking_logs: {
        Row: {
          id: string;
          recipe_id: string;
          menu_entry_id: string | null;
          cooked_on: string;
          rating: CookingRating | null;
          comment: string | null;
          photo_url: string | null;
          author: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          menu_entry_id?: string | null;
          cooked_on: string;
          rating?: CookingRating | null;
          comment?: string | null;
          photo_url?: string | null;
          author?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cooking_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "cooking_logs_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cooking_logs_menu_entry_id_fkey";
            columns: ["menu_entry_id"];
            isOneToOne: false;
            referencedRelation: "menu_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      shopping_lists: {
        Row: {
          id: string;
          start_date: string;
          end_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          start_date: string;
          end_date: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shopping_lists"]["Insert"]>;
        Relationships: [];
      };
      shopping_items: {
        Row: {
          id: string;
          list_id: string;
          name: string;
          amount: number | null;
          unit: string | null;
          category: string | null;
          checked: boolean;
          source_recipe_ids: string[];
          is_manual: boolean;
          is_pantry: boolean;
        };
        Insert: {
          id?: string;
          list_id: string;
          name: string;
          amount?: number | null;
          unit?: string | null;
          category?: string | null;
          checked?: boolean;
          source_recipe_ids?: string[];
          is_manual?: boolean;
          is_pantry?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["shopping_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "shopping_items_list_id_fkey";
            columns: ["list_id"];
            isOneToOne: false;
            referencedRelation: "shopping_lists";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      recipe_cooking_stats: {
        Row: {
          recipe_id: string;
          count: number;
          last_cooked_on: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      list_recipe_tags: {
        Args: Record<string, never>;
        Returns: string[];
      };
      swap_menu_entry_position: {
        Args: { p_date: string; p_id: string; p_direction: string };
        Returns: undefined;
      };
      move_menu_entry_to_date: {
        Args: { p_id: string; p_new_date: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Jsonb = Json;
