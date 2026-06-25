create table if not exists rsvp (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text default '',
  guests      integer default 1,
  session     text default 'morning' check (session in ('morning', 'evening', 'both')),
  dietary     text default '',
  message     text default '',
  created_at  timestamptz default now()
);

-- disable RLS so service role key can read/write freely
alter table rsvp disable row level security;
