(() => {
  'use strict';
  const root = document.documentElement;
  const redirect = () => location.replace(root.dataset.toolFallback);
  const reveal = () => root.classList.remove('vpmed-tool-checking');

  if (window.parent !== window) {
    try {
      const host = window.parent;
      if (host.location.origin === location.origin &&
          !host.document.documentElement.classList.contains('vpmed-auth-checking') &&
          (host.VPMED_AUTH?.profile?.status === 'approved' || host.VPMED_AUTH_OFFLINE?.profile?.status === 'approved')) {
        reveal();
        return;
      }
    } catch (error) {
      // A tool cannot be opened by a parent from another origin.
    }
    redirect();
    return;
  }

  if (root.dataset.toolEntry !== 'account' || !window.supabase) {
    redirect();
    return;
  }

  const client = window.supabase.createClient(
    'https://jaswtdcgrfbygmdxvumu.supabase.co',
    'sb_publishable_O6LzzHIKE9nWoSxhLQNlsw_shxEqdLC'
  );
  let signedOut = false;
  client.auth.onAuthStateChange((event) => {
    if (event !== 'SIGNED_OUT') return;
    signedOut = true;
    root.classList.add('vpmed-tool-checking');
    redirect();
  });

  async function verifyAccount() {
    const {data, error} = await client.auth.getUser();
    const user = data?.user;
    if (error || !user || !/@vpmed\.vn$/i.test(user.email || '')) {
      redirect();
      return;
    }
    const profile = await client.from('profiles').select('status').eq('id', user.id).maybeSingle();
    if (profile.error || profile.data?.status !== 'approved') {
      redirect();
      return;
    }
    if (!signedOut) reveal();
  }

  verifyAccount().catch(redirect);
})();
