import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

 
  private supabaseUrl = 'https://ghddxbcswvhhmccphapq.supabase.co';
  private supabaseKey = 'sb_publishable_rZJ6VW_ox2T1ewwwPZtJoA_mHRRJDT8';

  constructor() {
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  get client() {
    return this.supabase;
  }
}