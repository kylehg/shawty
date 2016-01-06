
// User page
function UserProfileFetcher(req) {
  return new Fetcher(req)
    .get('user').by('userId')
    .get('posts', 'WRITTEN_BY', ).by('userId').with(WrittenFetcher)
}
