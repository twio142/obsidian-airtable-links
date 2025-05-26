# Obsidian Airtable Links

List Airtable links in a code block.

Use my personal Airtable base for collecting links, which consists of two tables:

- **Links**: Contains the links.
- **List**: Contains the list of links.

This plugins takes a **list** from the List table and displays its **links** in a table.

## To-Do

- Implement codeblock processor.
    - Process codeblocks marked as `airtable`
    - Retrieve the record ID in it, and fetch the links from Airtable
    - Render a table with dataview API. Filter or sort links based on the codeblock.

### Example

```airtable
list = recXXXXXXXXX
where done = 0
order by name desc
limit 10
```
